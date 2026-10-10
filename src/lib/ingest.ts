import "server-only";
import { z } from "zod";
import { classify, isCategory } from "./categories";
import { db } from "./db";
import type { EventInput, EventOrigin } from "./types";

/** Payload the cloud agent POSTs to /api/ingest. Documented for the agent in agent/ROUTINE.md. */
export const IngestEvent = z.object({
  church_slug: z.string(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).nullish(),
  start: z.iso.datetime({ offset: true }).or(z.iso.date()),
  end: z.iso.datetime({ offset: true }).nullish(),
  all_day: z.boolean().optional(),
  location: z.string().max(300).nullish(),
  categories: z.array(z.string()).default([]),
  source_url: z.url().nullish(),
});
export type IngestEvent = z.infer<typeof IngestEvent>;

export const IngestPayload = z.object({ events: z.array(IngestEvent).max(1000) });

/**
 * Normalizes and upserts events. Unknown church slugs are reported, not fatal; unknown
 * categories are dropped, and events with none left fall back to the keyword classifier.
 */
export async function ingest(events: IngestEvent[], origin: EventOrigin) {
  const churches = await db().listChurches();
  const bySlug = new Map(churches.map((c) => [c.slug, c.id]));
  const unknownChurches = new Set<string>();
  const rows: EventInput[] = [];

  for (const e of events) {
    const church_id = bySlug.get(e.church_slug);
    if (!church_id) {
      unknownChurches.add(e.church_slug);
      continue;
    }
    const dateOnly = !e.start.includes("T");
    let categories = e.categories.filter(isCategory);
    if (!categories.length) categories = classify(e.title, e.description ?? "");
    rows.push({
      church_id,
      title: e.title.trim(),
      description: e.description?.trim() || null,
      // Date-only events are anchored at noon Central so they never slip a day across time zones.
      start: dateOnly ? `${e.start}T12:00:00-05:00` : e.start,
      end: e.end ?? null,
      all_day: e.all_day ?? dateOnly,
      location: e.location?.trim() || null,
      categories,
      source_url: e.source_url ?? null,
      origin,
    });
  }

  const result = await db().upsertEvents(rows);
  return { ...result, skipped: events.length - rows.length, unknown_churches: [...unknownChurches] };
}
