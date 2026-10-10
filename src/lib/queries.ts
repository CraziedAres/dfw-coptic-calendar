import "server-only";
import { db } from "./db";
import { shortChurchName } from "./site";
import type { ClientEvent } from "@/components/CalendarBoard";
import type { Church, ChurchEvent } from "./types";

export function toClientEvents(events: ChurchEvent[], churches: Church[]): ClientEvent[] {
  const byId = new Map(churches.map((c) => [c.id, c]));
  return events.flatMap((e) => {
    const church = byId.get(e.church_id);
    if (!church) return [];
    return [{
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.all_day,
      categories: e.categories,
      churchSlug: church.slug,
      churchName: shortChurchName(church.name),
      location: e.location,
      description: e.description,
      sourceUrl: e.source_url,
    }];
  });
}

/** Events from the start of last month through ~6 months out — enough for normal browsing. */
export async function calendarWindow() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 7, 1);
  const [churches, events] = await Promise.all([db().listChurches(), db().listEvents({ from, to })]);
  return { churches, events: toClientEvents(events, churches) };
}
