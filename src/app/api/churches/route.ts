import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/categories";
import { db } from "@/lib/db";

/** Public: the church list (with event sources) and category vocabulary the cloud agent works from. */
export async function GET() {
  const churches = await db().listChurches();
  return NextResponse.json({
    // liturgy_times tells the agent whether a church's regular liturgies already appear on its page.
    churches: churches.map(({ slug, name, city, website, sources, liturgy_times }) => ({ slug, name, city, website, sources, liturgy_times })),
    categories: CATEGORIES.map(({ slug, label, group }) => ({ slug, label, group })),
  });
}
