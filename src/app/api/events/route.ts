import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public: one church's saved events from a week ago through seven weeks ahead. The weekly agent reads
 * this to reuse saved titles exactly, since a reworded title is stored as a separate event.
 */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("church");
  if (!slug) return NextResponse.json({ error: "missing ?church=<slug>" }, { status: 400 });
  const church = await db().getChurchBySlug(slug);
  if (!church) return NextResponse.json({ error: `unknown church "${slug}"` }, { status: 404 });

  const now = Date.now();
  const events = (await db().listEvents({ from: new Date(now - 7 * 86_400_000), to: new Date(now + 49 * 86_400_000) }))
    .filter((e) => e.church_id === church.id)
    .map(({ title, start, end, all_day, categories, origin }) => ({ title, start, end, all_day, categories, origin }));
  return NextResponse.json({ church: slug, events });
}
