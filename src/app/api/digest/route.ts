import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { sendWeeklyDigest } from "@/lib/digest";
import { emailEnabled } from "@/lib/site";

export const maxDuration = 60;

/** Weekly Vercel Cron (Monday morning Central). */
export async function GET(req: Request) {
  if (!hasBearer(req, "CRON_SECRET")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!emailEnabled()) return NextResponse.json({ skipped: "EMAIL_ENABLED is not true" });
  return NextResponse.json(await sendWeeklyDigest());
}
