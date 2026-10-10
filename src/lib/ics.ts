import "server-only";
import ical, { type VEvent } from "node-ical";
import type { IngestEvent } from "./ingest";

const WINDOW_DAYS = 42;

function iso(d: Date) {
  return d.toISOString();
}

/**
 * node-ical's rrule expansion comes back shifted by the *host's* UTC offset: correct instants on a
 * UTC server (Vercel), but wall-clock-as-UTC on a machine set to Central. Undo the host offset so
 * results are the same everywhere. Verified under TZ=UTC, America/Chicago and America/Los_Angeles.
 */
function fromHostShifted(d: Date): Date {
  return new Date(d.getTime() + d.getTimezoneOffset() * 60_000);
}

/** Fetches an ICS feed and returns events in the next six weeks, with recurrences expanded. */
export async function fetchIcsEvents(url: string, churchSlug: string): Promise<IngestEvent[]> {
  const data = await ical.async.fromURL(url);
  const from = new Date();
  const to = new Date(from.getTime() + WINDOW_DAYS * 86_400_000);
  const out: IngestEvent[] = [];

  for (const item of Object.values(data)) {
    if (!item || item.type !== "VEVENT") continue;
    const ev = item as VEvent;
    const durationMs = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;
    const allDay = ev.datetype === "date";
    const title = typeof ev.summary === "string" ? ev.summary : (ev.summary as { val?: string })?.val ?? "";
    const description = typeof ev.description === "string" ? ev.description : null;
    const location = typeof ev.location === "string" ? ev.location : null;

    const starts: Date[] = ev.rrule
      ? ev.rrule
          .between(from, to, true)
          .filter((d) => !isExcluded(ev, d))
          .map((d) => (allDay ? d : fromHostShifted(d)))
      : ev.start >= from && ev.start < to
        ? [ev.start]
        : [];

    for (const start of starts) {
      const override = ev.recurrences?.[start.toISOString().slice(0, 10)];
      const s = override?.start ?? start;
      out.push({
        church_slug: churchSlug,
        title: (override?.summary as string) || title,
        description,
        start: allDay ? s.toISOString().slice(0, 10) : iso(s),
        end: !allDay && durationMs ? iso(new Date(s.getTime() + durationMs)) : null,
        all_day: allDay,
        location,
        categories: [],
        source_url: typeof ev.url === "string" ? ev.url : null,
      });
    }
  }
  return out.filter((e) => e.title.length >= 2);
}

function isExcluded(ev: VEvent, d: Date): boolean {
  if (!ev.exdate) return false;
  const key = d.toISOString().slice(0, 10);
  return Object.keys(ev.exdate).some((k) => k.slice(0, 10) === key);
}
