"use server";

import { createElement } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import ConfirmEmail from "@/emails/ConfirmEmail";
import { getCategory, isCategory } from "@/lib/categories";
import { db } from "@/lib/db";
import { sendEmails } from "@/lib/email";
import { emailEnabled, siteUrl } from "@/lib/site";

export type FormState = { error?: string } | undefined;

function readPrefs(form: FormData) {
  return {
    categories: form.getAll("categories").map(String).filter(isCategory),
    church_ids: form.getAll("church_ids").map(String),
  };
}

export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  if (!emailEnabled()) return { error: "The weekly email isn't available yet." };
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Please enter a valid email address." };
  const prefs = readPrefs(form);
  if (!prefs.categories.length) return { error: "Choose at least one category." };

  // Existing confirmed subscribers get a link to their preferences instead, so nobody can
  // change someone else's subscription by typing their address.
  const sub = await db().saveSubscriber({ email: email.data, ...prefs });
  await sendEmails([
    {
      to: sub.email,
      subject: sub.confirmed ? "Manage your weekly DFW Coptic events email" : "Confirm your weekly DFW Coptic events email",
      react: createElement(ConfirmEmail, {
        siteUrl: siteUrl(),
        confirmUrl: sub.confirmed ? `${siteUrl()}/preferences/${sub.token}` : `${siteUrl()}/api/confirm?token=${sub.token}`,
        categories: sub.categories.map((c) => getCategory(c)?.label ?? c),
        alreadySubscribed: sub.confirmed,
      }),
    },
  ]);
  redirect("/subscribe?sent=1");
}

export async function updatePreferences(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const prefs = readPrefs(form);
  if (!prefs.categories.length) return { error: "Choose at least one category, or unsubscribe below." };
  const sub = await db().updateSubscriber(token, prefs);
  if (!sub) return { error: "This link is no longer valid." };
  redirect(`/preferences/${token}?saved=1`);
}

export async function unsubscribe(form: FormData) {
  await db().deleteSubscriber(String(form.get("token") ?? ""));
  redirect("/subscribe?unsubscribed=1");
}
