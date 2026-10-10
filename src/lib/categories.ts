export type CategoryGroup = "youth" | "couples" | "liturgical" | "service";

export type Category = {
  slug: string;
  label: string;
  group: CategoryGroup;
  /** Lowercase keywords used to auto-classify ICS events and agent output. */
  keywords: string[];
};

export const GROUPS: { id: CategoryGroup; label: string }[] = [
  { id: "youth", label: "Youth" },
  { id: "couples", label: "Couples & Families" },
  { id: "liturgical", label: "Liturgical" },
  { id: "service", label: "Service & Retreats" },
];

export const CATEGORIES: Category[] = [
  { slug: "young-adults", label: "Young Adults", group: "youth", keywords: ["young adult", "ya ", "ya meeting", "college", "university", "servants of youth", "singles", "career"] },
  { slug: "teens", label: "Teens", group: "youth", keywords: ["high school", "teen", "hs ", "youth meeting", "youth night"] },
  { slug: "middle-school", label: "Middle School", group: "youth", keywords: ["middle school", "junior high", "ms "] },
  { slug: "kids", label: "Kids & Sunday School", group: "youth", keywords: ["sunday school", "kids", "children", "elementary", "kg", "vbs", "vacation bible"] },
  { slug: "couples", label: "Couples", group: "couples", keywords: ["couple", "marriage", "married", "engaged"] },
  { slug: "families", label: "Families", group: "couples", keywords: ["family", "families", "parents", "mothers", "fathers", "picnic"] },
  { slug: "liturgy", label: "Liturgy", group: "liturgical", keywords: ["liturgy", "divine liturgy", "qurbana", "mass", "eucharist"] },
  { slug: "vespers-tasbeha", label: "Vespers & Tasbeha", group: "liturgical", keywords: ["vesper", "tasbeha", "midnight prai", "praises", "psalmody", "raising of incense", "agpeya"] },
  { slug: "feasts", label: "Feasts & Fasts", group: "liturgical", keywords: ["feast", "nativity", "theophany", "epiphany", "resurrection", "pascha", "holy week", "lent", "fast", "nayrouz", "apostles", "dormition", "assumption"] },
  { slug: "bible-study", label: "Bible Study & Classes", group: "service", keywords: ["bible study", "bible class", "study class", "hymn", "sermon", "lecture", "catechism", "theology", "spiritual day", "ministry", "servant’s meeting", "servants meeting", "servant's meeting"] },
  { slug: "retreats", label: "Retreats & Conventions", group: "service", keywords: ["retreat", "convention", "conference", "camp", "trip", "pilgrimage"] },
  { slug: "service", label: "Service & Outreach", group: "service", keywords: ["service day", "outreach", "volunteer", "food drive", "homeless", "charity", "mission"] },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
  return bySlug.get(slug);
}

export function isCategory(slug: string): boolean {
  return bySlug.has(slug);
}

/** Group of the event's first category; drives the accent color on the calendar. */
export function primaryGroup(categories: string[]): CategoryGroup {
  return getCategory(categories[0] ?? "")?.group ?? "liturgical";
}

function match(text: string): string[] {
  const t = ` ${text} `.toLowerCase();
  return CATEGORIES.filter((c) => c.keywords.some((k) => t.includes(k))).map((c) => c.slug);
}

/**
 * Keyword classifier used for ICS feeds and as a fallback when an ingested event has no categories.
 * Titles are trusted first; descriptions are noisy ("after the liturgy…") so they're only a fallback.
 */
export function classify(title: string, description = ""): string[] {
  const fromTitle = match(title);
  return fromTitle.length ? fromTitle : match(description);
}
