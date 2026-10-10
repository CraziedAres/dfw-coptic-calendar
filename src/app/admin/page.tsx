import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { getCategory } from "@/lib/categories";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDay, formatTime } from "@/lib/site";
import { login, review } from "./actions";

export const metadata: Metadata = { title: "Review", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="container">
        <h1>Review</h1>
        {!process.env.ADMIN_PASSWORD && <p className="notice error">Set ADMIN_PASSWORD to enable this page.</p>}
        <ActionForm action={login} submitLabel="Sign in">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
        </ActionForm>
      </main>
    );
  }

  const [pending, churches] = await Promise.all([db().listSubmissions("pending"), db().listChurches()]);
  const churchName = new Map(churches.map((c) => [c.id, c.name]));

  return (
    <main className="container">
      <h1>Review submissions</h1>
      <p className="lede">{pending.length ? `${pending.length} waiting.` : "Nothing waiting."}</p>
      {pending.map((s) => (
        <div className="admin-card" key={s.id}>
          <h3>{s.title}</h3>
          <div className="muted">
            {churchName.get(s.church_id)} · {formatDay(s.start)} at {formatTime(s.start)}
            {s.location ? ` · ${s.location}` : ""}
          </div>
          <div>
            {s.categories.map((c) => (
              <span key={c} className="tag">
                {getCategory(c)?.label ?? c}
              </span>
            ))}
          </div>
          {s.description && <p style={{ whiteSpace: "pre-line" }}>{s.description}</p>}
          <div className="muted">
            {s.submitter_email ? `From ${s.submitter_email}` : "Submitted anonymously"}
            {s.flyer_url && (
              <>
                {" · "}
                <a href={s.flyer_url} target="_blank" rel="noreferrer">
                  Flyer
                </a>
              </>
            )}
          </div>
          <div className="admin-actions">
            <form action={review}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn" name="decision" value="approve">
                Approve
              </button>
            </form>
            <form action={review}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn ghost" name="decision" value="reject">
                Reject
              </button>
            </form>
          </div>
        </div>
      ))}
    </main>
  );
}
