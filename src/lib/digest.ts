import "server-only";
import { createElement } from "react";
import DigestEmail, { type DigestDay } from "@/emails/DigestEmail";
import { getCategory } from "./categories";
import { fastFor, formatCoptic } from "./coptic-date";
import { db } from "./db";
import { sendEmails, type OutgoingEmail } from "./email";
import { dayKey, formatDay, formatTime, shortChurchName, siteUrl, TIME_ZONE } from "./site";
import type { Church, ChurchEvent, Subscriber } from "./types";

/** Next 7 days starting now (the cron runs Monday morning, so this is Mon–Sun). */
export function digestWindow(now = new Date()) {
  return { from: now, to: new Date(now.getTime() + 7 * 86_400_000) };
}

export function eventsForSubscriber(events: ChurchEvent[], sub: Subscriber): ChurchEvent[] {
  return events.filter(
    (e) =>
      (!sub.church_ids.length || sub.church_ids.includes(e.church_id)) &&
      e.categories.some((c) => sub.categories.includes(c)),
  );
}

function buildDays(events: ChurchEvent[], churches: Map<string, Church>, base: string): DigestDay[] {
  const days = new Map<string, DigestDay>();
  for (const e of events) {
    const key = dayKey(e.start);
    if (!days.has(key)) {
      const [y, m, d] = key.split("-").map(Number);
      const local = new Date(y, m - 1, d);
      days.set(key, { label: formatDay(e.start), coptic: formatCoptic(local), fast: fastFor(local), events: [] });
    }
    const church = churches.get(e.church_id);
    days.get(key)!.events.push({
      title: e.title,
      time: e.all_day ? "All day" : formatTime(e.start),
      church: church ? shortChurchName(church.name) : "",
      location: e.location,
      url: church ? `${base}/churches/${church.slug}` : base,
      categories: e.categories.map((c) => getCategory(c)?.label ?? c),
    });
  }
  return [...days.values()];
}

/** Builds and sends one email per confirmed subscriber who has at least one matching event. */
export async function sendWeeklyDigest(now = new Date()) {
  const { from, to } = digestWindow(now);
  const [subscribers, events, churchList] = await Promise.all([
    db().listConfirmedSubscribers(),
    db().listEvents({ from, to }),
    db().listChurches(),
  ]);
  const churches = new Map(churchList.map((c) => [c.id, c]));
  const base = siteUrl();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: TIME_ZONE });
  const weekLabel = `${fmt(from)} – ${fmt(new Date(to.getTime() - 86_400_000))}`;

  const emails: OutgoingEmail[] = [];
  let skippedEmpty = 0;
  for (const sub of subscribers) {
    const mine = eventsForSubscriber(events, sub);
    if (!mine.length) {
      skippedEmpty++;
      continue;
    }
    const preferencesUrl = `${base}/preferences/${sub.token}`;
    const calendarUrl = `${base}/?c=${sub.categories.join(",")}`;
    emails.push({
      to: sub.email,
      subject: `This week: ${mine.length} event${mine.length === 1 ? "" : "s"} · DFW Coptic Calendar`,
      unsubscribeUrl: `${base}/api/unsubscribe?token=${sub.token}`,
      react: createElement(DigestEmail, { siteUrl: base, weekLabel, days: buildDays(mine, churches, base), preferencesUrl, calendarUrl }),
    });
  }

  const result = await sendEmails(emails);
  return { subscribers: subscribers.length, skippedEmpty, ...result };
}
