import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { hasBearer } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchIcsEvents } from "@/lib/ics";
import { ingest, type IngestEvent } from "@/lib/ingest";

export const maxDuration = 60;

/** Daily Vercel Cron: pull every church's public calendar feeds (no LLM involved). */
export async function GET(req: Request) {
  if (!hasBearer(req, "CRON_SECRET")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const churches = await db().listChurches();
  const events: IngestEvent[] = [];
  const failures: { church: string; url: string; error: string }[] = [];

  await Promise.all(
    churches.flatMap((c) =>
      c.sources
        .filter((s) => s.type === "ics")
        .map(async (s) => {
          try {
            events.push(...(await fetchIcsEvents(s.url, c.slug)));
          } catch (err) {
            failures.push({ church: c.slug, url: s.url, error: String(err) });
          }
        }),
    ),
  );

  const result = await ingest(events, "ics");
  revalidatePath("/", "layout");
  return NextResponse.json({ ...result, failures });
}
