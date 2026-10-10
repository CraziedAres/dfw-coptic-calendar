import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { dayKey } from "./site";
import type { Church, ChurchEvent, EventInput, Submission, SubmissionStatus, Subscriber } from "./types";

/**
 * Storage for the app. Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set,
 * otherwise a JSON file at data/dev-db.json so the app runs locally with no accounts.
 */
export interface Store {
  listChurches(): Promise<Church[]>;
  getChurchBySlug(slug: string): Promise<Church | null>;
  upsertChurches(churches: Omit<Church, "id">[]): Promise<number>;

  listEvents(range: { from: Date; to: Date }): Promise<ChurchEvent[]>;
  upsertEvents(events: EventInput[]): Promise<{ inserted: number; updated: number }>;

  getSubscriberByToken(token: string): Promise<Subscriber | null>;
  saveSubscriber(input: { email: string; categories: string[]; church_ids: string[] }): Promise<Subscriber>;
  updateSubscriber(token: string, patch: Partial<Pick<Subscriber, "categories" | "church_ids" | "confirmed">>): Promise<Subscriber | null>;
  deleteSubscriber(token: string): Promise<void>;
  listConfirmedSubscribers(): Promise<Subscriber[]>;

  createSubmission(input: Omit<Submission, "id" | "status" | "created_at">): Promise<Submission>;
  listSubmissions(status: SubmissionStatus): Promise<Submission[]>;
  setSubmissionStatus(id: string, status: SubmissionStatus): Promise<Submission | null>;
}

export function dedupeKey(e: Pick<EventInput, "church_id" | "title" | "start">): string {
  const title = e.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${e.church_id}|${title}|${dayKey(e.start)}`; // Central calendar day, regardless of the offset sent
}

const now = () => new Date().toISOString();
const newToken = () => crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

// ---------------------------------------------------------------- Supabase

class SupabaseStore implements Store {
  constructor(private sb: SupabaseClient) {}

  private async run<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
    const { data, error } = await p;
    if (error) throw new Error(error.message);
    return data as T;
  }

  listChurches() {
    return this.run<Church[]>(this.sb.from("churches").select("*").order("name"));
  }
  async getChurchBySlug(slug: string) {
    return this.run<Church | null>(this.sb.from("churches").select("*").eq("slug", slug).maybeSingle());
  }
  async upsertChurches(churches: Omit<Church, "id">[]) {
    const rows = await this.run<Church[]>(this.sb.from("churches").upsert(churches, { onConflict: "slug" }).select());
    return rows.length;
  }

  listEvents({ from, to }: { from: Date; to: Date }) {
    return this.run<ChurchEvent[]>(
      this.sb.from("events").select("*").gte("start", from.toISOString()).lt("start", to.toISOString()).order("start"),
    );
  }
  async upsertEvents(events: EventInput[]) {
    if (!events.length) return { inserted: 0, updated: 0 };
    const rows = events.map((e) => ({ ...e, dedupe_key: dedupeKey(e), updated_at: now() }));
    const keys = rows.map((r) => r.dedupe_key);
    const existing = await this.run<{ dedupe_key: string }[]>(this.sb.from("events").select("dedupe_key").in("dedupe_key", keys));
    await this.run(this.sb.from("events").upsert(rows, { onConflict: "dedupe_key" }));
    return { inserted: rows.length - existing.length, updated: existing.length };
  }

  getSubscriberByToken(token: string) {
    return this.run<Subscriber | null>(this.sb.from("subscribers").select("*").eq("token", token).maybeSingle());
  }
  async saveSubscriber(input: { email: string; categories: string[]; church_ids: string[] }) {
    const existing = await this.run<Subscriber | null>(this.sb.from("subscribers").select("*").eq("email", input.email).maybeSingle());
    if (existing?.confirmed) return existing; // prefs change only via the emailed token link
    if (existing) {
      return this.run<Subscriber>(
        this.sb.from("subscribers").update({ categories: input.categories, church_ids: input.church_ids }).eq("id", existing.id).select().single(),
      );
    }
    return this.run<Subscriber>(this.sb.from("subscribers").insert({ ...input, confirmed: false, token: newToken() }).select().single());
  }
  updateSubscriber(token: string, patch: Partial<Pick<Subscriber, "categories" | "church_ids" | "confirmed">>) {
    return this.run<Subscriber | null>(this.sb.from("subscribers").update(patch).eq("token", token).select().maybeSingle());
  }
  async deleteSubscriber(token: string) {
    await this.run(this.sb.from("subscribers").delete().eq("token", token));
  }
  listConfirmedSubscribers() {
    return this.run<Subscriber[]>(this.sb.from("subscribers").select("*").eq("confirmed", true));
  }

  createSubmission(input: Omit<Submission, "id" | "status" | "created_at">) {
    return this.run<Submission>(this.sb.from("submissions").insert({ ...input, status: "pending" }).select().single());
  }
  listSubmissions(status: SubmissionStatus) {
    return this.run<Submission[]>(this.sb.from("submissions").select("*").eq("status", status).order("created_at"));
  }
  setSubmissionStatus(id: string, status: SubmissionStatus) {
    return this.run<Submission | null>(this.sb.from("submissions").update({ status }).eq("id", id).select().maybeSingle());
  }
}

// ---------------------------------------------------------------- Local JSON file (dev only)

type FileData = { churches: Church[]; events: ChurchEvent[]; subscribers: Subscriber[]; submissions: Submission[] };

class FileStore implements Store {
  private file = path.join(process.cwd(), "data", "dev-db.json");

  private async load(): Promise<FileData> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      return { churches: [], events: [], subscribers: [], submissions: [] };
    }
  }
  private async save(data: FileData) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(data, null, 2));
  }
  private async mutate<T>(fn: (d: FileData) => T): Promise<T> {
    const d = await this.load();
    const result = fn(d);
    await this.save(d);
    return result;
  }

  async listChurches() {
    return (await this.load()).churches.sort((a, b) => a.name.localeCompare(b.name));
  }
  async getChurchBySlug(slug: string) {
    return (await this.load()).churches.find((c) => c.slug === slug) ?? null;
  }
  upsertChurches(churches: Omit<Church, "id">[]) {
    return this.mutate((d) => {
      for (const c of churches) {
        const i = d.churches.findIndex((x) => x.slug === c.slug);
        if (i >= 0) d.churches[i] = { ...d.churches[i], ...c };
        else d.churches.push({ ...c, id: crypto.randomUUID() });
      }
      return churches.length;
    });
  }

  async listEvents({ from, to }: { from: Date; to: Date }) {
    return (await this.load()).events
      .filter((e) => new Date(e.start) >= from && new Date(e.start) < to)
      .sort((a, b) => a.start.localeCompare(b.start));
  }
  upsertEvents(events: EventInput[]) {
    return this.mutate((d) => {
      let inserted = 0, updated = 0;
      for (const e of events) {
        const key = dedupeKey(e);
        const i = d.events.findIndex((x) => x.dedupe_key === key);
        if (i >= 0) {
          d.events[i] = { ...d.events[i], ...e, updated_at: now() };
          updated++;
        } else {
          d.events.push({ ...e, id: crypto.randomUUID(), dedupe_key: key, updated_at: now() });
          inserted++;
        }
      }
      return { inserted, updated };
    });
  }

  async getSubscriberByToken(token: string) {
    return (await this.load()).subscribers.find((s) => s.token === token) ?? null;
  }
  saveSubscriber(input: { email: string; categories: string[]; church_ids: string[] }) {
    return this.mutate((d) => {
      const existing = d.subscribers.find((s) => s.email === input.email);
      if (existing?.confirmed) return existing; // prefs change only via the emailed token link
      if (existing) return Object.assign(existing, input);
      const sub: Subscriber = { ...input, id: crypto.randomUUID(), confirmed: false, token: newToken(), created_at: now() };
      d.subscribers.push(sub);
      return sub;
    });
  }
  updateSubscriber(token: string, patch: Partial<Pick<Subscriber, "categories" | "church_ids" | "confirmed">>) {
    return this.mutate((d) => {
      const s = d.subscribers.find((x) => x.token === token);
      return s ? Object.assign(s, patch) : null;
    });
  }
  async deleteSubscriber(token: string) {
    await this.mutate((d) => void (d.subscribers = d.subscribers.filter((s) => s.token !== token)));
  }
  async listConfirmedSubscribers() {
    return (await this.load()).subscribers.filter((s) => s.confirmed);
  }

  createSubmission(input: Omit<Submission, "id" | "status" | "created_at">) {
    return this.mutate((d) => {
      const sub: Submission = { ...input, id: crypto.randomUUID(), status: "pending", created_at: now() };
      d.submissions.push(sub);
      return sub;
    });
  }
  async listSubmissions(status: SubmissionStatus) {
    return (await this.load()).submissions.filter((s) => s.status === status);
  }
  setSubmissionStatus(id: string, status: SubmissionStatus) {
    return this.mutate((d) => {
      const s = d.submissions.find((x) => x.id === id);
      return s ? Object.assign(s, { status }) : null;
    });
  }
}

let store: Store | undefined;

export function db(): Store {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    store = url && key ? new SupabaseStore(createClient(url, key, { auth: { persistSession: false } })) : new FileStore();
  }
  return store;
}
