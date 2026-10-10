import "server-only";
import type { IngestEvent } from "./ingest";
import { centralToIso, dayKey } from "./site";

const WINDOW_DAYS = 42;

const ORDINARY_LITURGY = /liturgy/i;
const SPECIAL_OCCASION = /feast|nativity|theophany|resurrection|pascha|holy week|nayrouz|apostles|dormition|assumption/i;

type StMaryItem = { name: string; eventDate: string; startTime: string; endTime: string };

/** "07:15pm" → "19:15". Throws on anything else so a format change surfaces as a sync failure. */
function to24h(time: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(time.trim());
  if (!m) throw new Error(`St. Mary calendar: unexpected time "${time}"`);
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function parse(data: unknown): StMaryItem[] {
  if (!Array.isArray(data)) throw new Error(`St. Mary calendar: expected an array, got ${data === null ? "null" : typeof data}`);
  return data.map((item, i) => {
    const o = item as Record<string, unknown>;
    if (typeof o !== "object" || o === null) throw new Error(`St. Mary calendar: item ${i} is not an object`);
    for (const k of ["name", "eventDate", "startTime"] as const) {
      if (typeof o[k] !== "string" || !o[k]) throw new Error(`St. Mary calendar: item ${i} is missing "${k}"`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.eventDate as string)) {
      throw new Error(`St. Mary calendar: item ${i} has eventDate "${o.eventDate}", expected YYYY-MM-DD`);
    }
    if (o.endTime !== undefined && typeof o.endTime !== "string") throw new Error(`St. Mary calendar: item ${i} has a non-string endTime`);
    return { name: o.name as string, eventDate: o.eventDate as string, startTime: o.startTime as string, endTime: (o.endTime as string) ?? "" };
  });
}

/** St. Mary Colleyville's JSON calendar API (Central times, 12-hour clock), next six weeks, ordinary liturgies skipped. */
export async function fetchStMaryEvents(url: string, churchSlug: string): Promise<IngestEvent[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`St. Mary calendar: HTTP ${res.status}`);
  const items = parse(await res.json().catch(() => {
    throw new Error("St. Mary calendar: response is not JSON");
  }));

  const today = dayKey(new Date().toISOString());
  const last = dayKey(new Date(Date.now() + WINDOW_DAYS * 86_400_000).toISOString());

  return items
    .filter((e) => e.eventDate >= today && e.eventDate <= last)
    .filter((e) => !ORDINARY_LITURGY.test(e.name) || SPECIAL_OCCASION.test(e.name))
    .map((e) => ({
      church_slug: churchSlug,
      title: e.name.trim(),
      description: null,
      start: centralToIso(`${e.eventDate}T${to24h(e.startTime)}`),
      end: e.endTime.trim() ? centralToIso(`${e.eventDate}T${to24h(e.endTime)}`) : null,
      all_day: false,
      location: null,
      categories: [],
      source_url: url,
    }));
}
