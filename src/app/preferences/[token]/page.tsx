import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { CategoryChecks, ChurchChecks } from "@/components/CategoryChecks";
import { CrossRule } from "@/components/CopticCross";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/site";
import { unsubscribe, updatePreferences } from "../../subscribe/actions";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function PreferencesPage({ params, searchParams }: Props) {
  if (!emailEnabled()) notFound();
  const { token } = await params;
  const q = await searchParams;
  const [sub, churches] = await Promise.all([db().getSubscriberByToken(token), db().listChurches()]);

  if (!sub) {
    return (
      <main className="container">
        <h1>Email preferences</h1>
        <p className="notice error">
          This link is no longer valid. <Link href="/subscribe">Subscribe again</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Email preferences</h1>
      <p className="lede">For {sub.email}</p>
      {q.confirmed && <p className="notice">Your subscription is confirmed. The first email arrives Monday morning.</p>}
      {q.saved && <p className="notice">Saved.</p>}

      <ActionForm action={updatePreferences} submitLabel="Save preferences">
        <input type="hidden" name="token" value={token} />
        <CategoryChecks legend="Send me" selected={sub.categories} />
        <ChurchChecks churches={churches} selected={sub.church_ids} />
      </ActionForm>

      <CrossRule />

      <form action={unsubscribe}>
        <input type="hidden" name="token" value={token} />
        <button className="btn ghost" type="submit">
          Unsubscribe
        </button>
      </form>
    </main>
  );
}
