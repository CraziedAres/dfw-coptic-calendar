export const SITE_NAME = "DFW Coptic Calendar";
export const TIME_ZONE = "America/Chicago";

/** The weekly email (subscribe pages + Monday digest) is off unless EMAIL_ENABLED=true. */
export const emailEnabled = () => process.env.EMAIL_ENABLED === "true";

export function siteUrl(): string {
  const url = process.env.SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: TIME_ZONE });
}

/** YYYY-MM-DD in Central time; used to group events by day. */
export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Converts a wall-clock time ("2026-10-12T19:30"), read in `timeZone` (default Central), to ISO with offset. */
export function centralToIso(local: string, timeZone = TIME_ZONE): string {
  const asUtc = new Date(`${local}:00Z`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(asUtc)
      .map((p) => [p.type, p.value]),
  );
  const offset = (parts.timeZoneName as string).replace("GMT", "") || "+00:00"; // e.g. "-05:00"
  return `${local}:00${offset}`;
}

/** "St. Marina American Coptic Orthodox Church" → "St. Marina". */
export function shortChurchName(name: string): string {
  return name.replace(/\s+(American\s+)?Coptic Orthodox (Church|Community)$/, "");
}
