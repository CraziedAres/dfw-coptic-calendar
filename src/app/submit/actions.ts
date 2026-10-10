"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isCategory } from "@/lib/categories";
import { db } from "@/lib/db";
import { centralToIso } from "@/lib/site";
import type { FormState } from "../subscribe/actions";

const LocalDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

const Submission = z.object({
  church_id: z.string().min(1, "Choose a church."),
  title: z.string().trim().min(3, "Add a title.").max(200),
  start: LocalDateTime,
  end: LocalDateTime.or(z.literal("")),
  location: z.string().trim().max(300),
  description: z.string().trim().max(4000),
  flyer_url: z.url().or(z.literal("")),
  submitter_email: z.email("That email address doesn't look right.").or(z.literal("")),
});

export async function submitEvent(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) redirect("/submit?thanks=1"); // honeypot: bots fill every field

  const parsed = Submission.safeParse(Object.fromEntries(["church_id", "title", "start", "end", "location", "description", "flyer_url", "submitter_email"].map((k) => [k, String(form.get(k) ?? "")])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const categories = form.getAll("categories").map(String).filter(isCategory);
  if (!categories.length) return { error: "Choose at least one category." };

  const d = parsed.data;
  if (!(await db().listChurches()).some((c) => c.id === d.church_id)) return { error: "Choose a church." };

  await db().createSubmission({
    church_id: d.church_id,
    title: d.title,
    start: centralToIso(d.start),
    end: d.end ? centralToIso(d.end) : null,
    location: d.location || null,
    description: d.description || null,
    flyer_url: d.flyer_url || null,
    submitter_email: d.submitter_email,
    categories,
  });
  redirect("/submit?thanks=1");
}
