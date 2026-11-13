// Finds events the weekly agent saved more than once under reworded titles, and removes the extra copies.
// Run with: npm run dedupe-events            (preview only)
//           npm run dedupe-events -- --apply (delete the extra copies)
//
// Two agent events are copies when they're at the same church and the same start time and their titles
// share most of their words ("Annual Career Fair" / "High School Career Fair"). In each group the most
// recently updated copy is kept, since it carries the wording from the latest scan.
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { db } from "../src/lib/db";
import type { ChurchEvent } from "../src/lib/types";

const STOPWORDS = new Set(["the", "a", "an", "and", "of", "for", "with", "w", "at", "in", "on", "to", "st", "sat", "sun"]);

function words(title: string): Set<string> {
  return new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOPWORDS.has(w)));
}

/** Share of the shorter title's words that also appear in the other title. */
function overlap(a: string, b: string): number {
  const wa = words(a), wb = words(b);
  const [small, large] = wa.size <= wb.size ? [wa, wb] : [wb, wa];
  if (!small.size) return 0;
  return [...small].filter((w) => large.has(w)).length / small.size;
}

function groupCopies(events: ChurchEvent[]): ChurchEvent[][] {
  const bySlot = new Map<string, ChurchEvent[]>();
  for (const e of events) {
    const slot = `${e.church_id}|${new Date(e.start).getTime()}`;
    bySlot.set(slot, [...(bySlot.get(slot) ?? []), e]);
  }
  const groups: ChurchEvent[][] = [];
  for (const slot of bySlot.values()) {
    // Union events in the slot whose titles overlap; distinct gatherings at the same time stay apart.
    const parent = slot.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < slot.length; i++)
      for (let j = i + 1; j < slot.length; j++) if (overlap(slot[i].title, slot[j].title) >= 0.5) parent[find(i)] = find(j);
    const sets = new Map<number, ChurchEvent[]>();
    slot.forEach((e, i) => sets.set(find(i), [...(sets.get(find(i)) ?? []), e]));
    groups.push(...[...sets.values()].filter((g) => g.length > 1));
  }
  return groups;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const [churches, all] = await Promise.all([
    db().listChurches(),
    db().listEvents({ from: new Date("2000-01-01"), to: new Date("2100-01-01") }),
  ]);
  const churchName = new Map(churches.map((c) => [c.id, c.name]));
  const groups = groupCopies(all.filter((e) => e.origin === "agent"));

  const remove: ChurchEvent[] = [];
  for (const g of groups) {
    const [keep, ...extra] = [...g].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const when = new Date(keep.start).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    console.log(`${churchName.get(keep.church_id)} · ${when}`);
    console.log(`  keep    ${keep.title}`);
    for (const e of extra) console.log(`  remove  ${e.title}`);
    remove.push(...extra);
  }

  console.log(`\n${groups.length} duplicate groups, ${remove.length} extra copies.`);
  if (!apply) return console.log("Preview only. Re-run with --apply to delete the extra copies.");
  if (!remove.length) return;
  // Keep the removed rows so a mistaken cleanup can be re-imported.
  const dir = path.join(process.cwd(), "data", "backups");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `dedupe-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(remove, null, 2));
  console.log(`Backed up ${remove.length} rows to ${path.relative(process.cwd(), file)}`);
  console.log(`Deleted ${await db().deleteEvents(remove.map((e) => e.id))} events.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
