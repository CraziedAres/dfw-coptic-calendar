// Coptic (Alexandrian) calendar, Anno Martyrum. Integer Julian Day Number arithmetic.

const COPTIC_EPOCH = 1825030; // JDN of 1 Thout, 1 A.M. (29 Aug 284 Julian)

export const COPTIC_MONTHS = [
  "Thout", "Paopi", "Hathor", "Koiak", "Tobi", "Meshir",
  "Paremhat", "Parmouti", "Pashons", "Paoni", "Epip", "Mesori", "Nesi",
];

function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function copticToJdn(y: number, m: number, d: number): number {
  return COPTIC_EPOCH - 1 + 365 * (y - 1) + Math.floor(y / 4) + 30 * (m - 1) + d;
}

export type CopticDate = { year: number; month: number; day: number; monthName: string };

export function toCoptic(date: Date): CopticDate {
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const year = Math.floor((4 * (jdn - COPTIC_EPOCH) + 1463) / 1461);
  const month = Math.floor((jdn - copticToJdn(year, 1, 1)) / 30) + 1;
  const day = jdn + 1 - copticToJdn(year, month, 1);
  return { year, month, day, monthName: COPTIC_MONTHS[month - 1] };
}

export function formatCoptic(date: Date): string {
  const c = toCoptic(date);
  return `${c.day} ${c.monthName} ${c.year} A.M.`;
}

/** Coptic Pascha (same as Eastern Orthodox): Julian computus, shifted to Gregorian (valid 1900–2099). */
export function copticEaster(year: number): Date {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return new Date(year, month - 1, day + 13);
}

const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const between = (d: Date, start: Date, end: Date) => d >= start && d <= end;

/**
 * The named fasting season a day falls in, or null. Wednesdays and Fridays are reported as
 * "Wednesday fast" / "Friday fast" outside the Holy Fifty Days and the Nativity–Theophany feast days.
 */
export function fastFor(input: Date): string | null {
  const date = atMidnight(input);
  const y = date.getFullYear();
  const pascha = copticEaster(y);

  if (between(date, addDays(pascha, -69), addDays(pascha, -67))) return "Fast of Nineveh";
  if (between(date, addDays(pascha, -55), addDays(pascha, -8))) return "Great Lent";
  if (between(date, addDays(pascha, -7), addDays(pascha, -1))) return "Holy Week";

  const pentecost = addDays(pascha, 49);
  const apostlesEnd = new Date(y, 6, 11);
  if (pentecost < apostlesEnd && between(date, addDays(pentecost, 1), apostlesEnd)) return "Apostles' Fast";
  if (between(date, new Date(y, 7, 7), new Date(y, 7, 21))) return "Fast of St. Mary";
  if (date >= new Date(y, 10, 25) || date <= new Date(y, 0, 6)) return "Nativity Fast";

  const fiftyDays = between(date, pascha, pentecost);
  const nativityToTheophany = between(date, new Date(y, 0, 7), new Date(y, 0, 19));
  const dow = date.getDay();
  if (!fiftyDays && !nativityToTheophany && (dow === 3 || dow === 5)) {
    return dow === 3 ? "Wednesday fast" : "Friday fast";
  }
  return null;
}

/** True for multi-week seasons (shown in the header); weekly fasts are only marked on day cells. */
export function isSeasonalFast(name: string | null): boolean {
  return !!name && !name.endsWith("day fast");
}

