import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Checks `Authorization: Bearer <secret>` against an env var. Fails closed if the env var is unset. */
export function hasBearer(req: Request, envName: "INGEST_SECRET" | "CRON_SECRET"): boolean {
  const secret = process.env[envName];
  const header = req.headers.get("authorization") ?? "";
  return !!secret && safeEqual(header, `Bearer ${secret}`);
}

export const ADMIN_COOKIE = "dfw_admin";

/** Cookie value is a hash of the admin password, so changing the password logs everyone out. */
export function adminCookieValue(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? createHash("sha256").update(`dfw-coptic-admin:${pw}`).digest("hex") : null;
}

export function checkAdminPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && safeEqual(input, pw);
}

export async function isAdmin(): Promise<boolean> {
  const expected = adminCookieValue();
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!expected && !!got && safeEqual(got, expected);
}
