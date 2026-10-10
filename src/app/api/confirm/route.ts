import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const sub = token ? await db().updateSubscriber(token, { confirmed: true }) : null;
  return NextResponse.redirect(sub ? `${siteUrl()}/preferences/${token}?confirmed=1` : `${siteUrl()}/subscribe?invalid=1`, 303);
}
