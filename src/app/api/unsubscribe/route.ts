import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// POST: RFC 8058 one-click unsubscribe from the mail client. GET: plain link fallback.
async function unsubscribe(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) await db().deleteSubscriber(token);
  return token;
}

export async function POST(req: Request) {
  await unsubscribe(req);
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: Request) {
  await unsubscribe(req);
  return NextResponse.redirect(`${siteUrl()}/subscribe?unsubscribed=1`, 303);
}
