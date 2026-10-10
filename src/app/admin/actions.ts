"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminCookieValue, checkAdminPassword, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "../subscribe/actions";

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!checkAdminPassword(String(form.get("password") ?? ""))) return { error: "Incorrect password." };
  (await cookies()).set(ADMIN_COOKIE, adminCookieValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function review(form: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(form.get("id"));
  const approve = form.get("decision") === "approve";
  const sub = await db().setSubmissionStatus(id, approve ? "approved" : "rejected");
  if (sub && approve) {
    await db().upsertEvents([
      {
        church_id: sub.church_id,
        title: sub.title,
        description: sub.description,
        start: sub.start,
        end: sub.end,
        all_day: false,
        location: sub.location,
        categories: sub.categories,
        source_url: sub.flyer_url,
        origin: "submission",
      },
    ]);
    revalidatePath("/", "layout");
  }
  revalidatePath("/admin");
}
