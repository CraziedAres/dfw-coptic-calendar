import "server-only";
import { render } from "@react-email/components";
import { promises as fs } from "fs";
import path from "path";
import type { ReactElement } from "react";
import { Resend } from "resend";

export type OutgoingEmail = { to: string; subject: string; react: ReactElement; unsubscribeUrl?: string };

const from = () => process.env.EMAIL_FROM ?? "DFW Coptic Calendar <onboarding@resend.dev>";

/**
 * Sends through Resend when RESEND_API_KEY is set (batched, 100 per request).
 * Without a key, writes each email to data/outbox/*.html so it can be previewed locally.
 */
export async function sendEmails(emails: OutgoingEmail[]): Promise<{ sent: number; failed: number }> {
  if (!emails.length) return { sent: 0, failed: 0 };
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    const dir = path.join(process.cwd(), "data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    for (const e of emails) {
      const file = path.join(dir, `${Date.now()}-${e.to.replace(/[^a-z0-9]+/gi, "_")}.html`);
      await fs.writeFile(file, `<!-- To: ${e.to} | Subject: ${e.subject} -->\n${await render(e.react)}`);
      console.log(`[email:dev] ${e.subject} → ${e.to} (${path.relative(process.cwd(), file)})`);
    }
    return { sent: emails.length, failed: 0 };
  }

  const resend = new Resend(key);
  let sent = 0, failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const { error } = await resend.batch.send(
      await Promise.all(
        chunk.map(async (e) => ({
          from: from(),
          to: e.to,
          subject: e.subject,
          html: await render(e.react),
          text: await render(e.react, { plainText: true }),
          headers: e.unsubscribeUrl
            ? { "List-Unsubscribe": `<${e.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
            : undefined,
        })),
      ),
    );
    if (error) {
      console.error("[email] batch failed", error);
      failed += chunk.length;
    } else sent += chunk.length;
  }
  return { sent, failed };
}
