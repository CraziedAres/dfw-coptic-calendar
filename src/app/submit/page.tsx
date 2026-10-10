import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { CategoryChecks } from "@/components/CategoryChecks";
import { db } from "@/lib/db";
import { submitEvent } from "./actions";

export const metadata: Metadata = { title: "Submit an event" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function SubmitPage({ searchParams }: Props) {
  const q = await searchParams;
  const churches = await db().listChurches();
  return (
    <main className="container">
      <h1>Submit an event</h1>
      <p className="lede">
        For servants and organizers. Many meetings are only announced on Instagram or a flyer — add them here and
        they&rsquo;ll appear on the calendar once reviewed.
      </p>
      {q.thanks && <p className="notice">Thank you. Your event will appear once it&rsquo;s been reviewed.</p>}

      <ActionForm action={submitEvent} submitLabel="Submit for review">
        <div className="field">
          <label htmlFor="church_id">Church</label>
          <select id="church_id" name="church_id" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="title">Event title</label>
          <input id="title" name="title" type="text" required placeholder="Young Adults Friday Meeting" />
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="start">Starts (Central time)</label>
            <input id="start" name="start" type="datetime-local" required />
          </div>
          <div className="field">
            <label htmlFor="end">Ends (optional)</label>
            <input id="end" name="end" type="datetime-local" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="location">Location (if not at the church)</label>
          <input id="location" name="location" type="text" />
        </div>
        <div className="field">
          <label htmlFor="description">Details</label>
          <textarea id="description" name="description" rows={4} />
        </div>
        <div className="field">
          <label htmlFor="flyer_url">Link to flyer or post (optional)</label>
          <input id="flyer_url" name="flyer_url" type="url" placeholder="https://instagram.com/p/…" />
        </div>
        <CategoryChecks legend="Who is it for?" />
        <div className="field">
          <label htmlFor="submitter_email">Your email, if we may ask a question about it (optional, never shown)</label>
          <input id="submitter_email" name="submitter_email" type="email" />
        </div>
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
          <label>
            Website <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </ActionForm>
    </main>
  );
}
