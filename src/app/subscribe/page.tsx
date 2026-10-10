import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { CategoryChecks, ChurchChecks } from "@/components/CategoryChecks";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/site";
import { subscribe } from "./actions";

export const metadata: Metadata = { title: "Weekly email" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function SubscribePage({ searchParams }: Props) {
  if (!emailEnabled()) notFound();
  const q = await searchParams;
  const churches = await db().listChurches();
  return (
    <main className="container">
      <h1>Weekly email</h1>
      <p className="lede">
        Every Monday morning, a short email with the week&rsquo;s events, limited to the kinds of gatherings you choose.
      </p>

      {q.sent && (
        <p className="notice">
          Almost done — check your inbox. (If you&rsquo;re already subscribed, we&rsquo;ve sent a link to manage your preferences.)
        </p>
      )}
      {q.unsubscribed && <p className="notice">You&rsquo;ve been unsubscribed. God be with you.</p>}
      {q.invalid && <p className="notice error">That confirmation link is no longer valid. Please subscribe again.</p>}

      <ActionForm action={subscribe} submitLabel="Subscribe">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <CategoryChecks legend="Send me" selected={["young-adults"]} />
        <ChurchChecks churches={churches} />
      </ActionForm>
    </main>
  );
}
