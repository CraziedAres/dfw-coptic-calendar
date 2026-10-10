import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { hasBearer } from "@/lib/auth";
import { IngestPayload, ingest } from "@/lib/ingest";

export async function POST(req: Request) {
  if (!hasBearer(req, "INGEST_SECRET")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = IngestPayload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues.slice(0, 20) }, { status: 400 });
  }

  const result = await ingest(parsed.data.events, "agent");
  revalidatePath("/", "layout");
  return NextResponse.json(result);
}
