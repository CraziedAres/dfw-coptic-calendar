import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/categories";
import { db } from "@/lib/db";

/** Public: the church list (with event sources) and category vocabulary the cloud agent works from. */
export async function GET() {
  const churches = await db().listChurches();
  return NextResponse.json({
    churches: churches.map(({ slug, name, city, website, sources }) => ({ slug, name, city, website, sources })),
    categories: CATEGORIES.map(({ slug, label, group }) => ({ slug, label, group })),
  });
}
