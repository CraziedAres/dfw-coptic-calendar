export type SourceType = "ics" | "stmary-json" | "web" | "social";

/** `hint` tells the weekly agent how to read a tricky source (see agent/ROUTINE.md). */
export type ChurchSource = { type: SourceType; url: string; hint?: string };

export type Church = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  website: string | null;
  sources: ChurchSource[];
  liturgy_times: string | null;
};

export type EventOrigin = "agent" | "ics" | "submission";

export type ChurchEvent = {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  start: string; // ISO 8601 with offset
  end: string | null;
  all_day: boolean;
  location: string | null;
  categories: string[];
  source_url: string | null;
  origin: EventOrigin;
  dedupe_key: string;
  updated_at: string;
};

export type Subscriber = {
  id: string;
  email: string;
  categories: string[];
  church_ids: string[]; // empty = all churches
  confirmed: boolean;
  token: string;
  created_at: string;
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type Submission = {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  location: string | null;
  categories: string[];
  flyer_url: string | null;
  submitter_email: string;
  status: SubmissionStatus;
  created_at: string;
};

/** Shape accepted by upsertEvents — ids/timestamps are filled in by the store. */
export type EventInput = Omit<ChurchEvent, "id" | "updated_at" | "dedupe_key">;
