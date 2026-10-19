"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { repo } from "@/lib/data";
import { demoFindUser } from "@/lib/data/demo";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import {
  endSession,
  getFamilyId,
  lockParent,
  pinLockedFor,
  recordPinAttempt,
  startDemoSession,
  unlockParent,
} from "@/lib/auth/session";
import { supabaseEnabled, supabaseServer } from "@/lib/supabase/server";
import { guard, pin, str, type ActionResult } from "@/lib/validate";

export async function signIn(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const result = await guard(async () => {
    const email = str(form, "email", { max: 200 });
    const password = str(form, "password", { max: 200 });
    if (supabaseEnabled) {
      const db = await supabaseServer();
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw new Error("That email and password don't match.");
      return;
    }
    const user = await demoFindUser(email);
    // Always run the hash so timing doesn't reveal which emails exist.
    const ok = verifySecret(password, user?.passwordHash ?? hashSecret("x"));
    if (!user || !ok) throw new Error("That email and password don't match.");
    await startDemoSession(user.familyId);
  });
  if (result.ok) redirect("/");
  return result;
}

export async function signUp(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const result = await guard(async () => {
    if (!supabaseEnabled) throw new Error("Sign up is available once Supabase is connected. Use the demo account for now.");
    const email = str(form, "email", { max: 200 });
    const password = str(form, "password", { max: 200 });
    const familyName = str(form, "familyName", { max: 60 });
    if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
    const db = await supabaseServer();
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { family_name: familyName }, emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) throw new Error(error.message);
    if (!data.session) return "Check your email and tap the link to confirm your account.";
  });
  if (result.ok && !result.message) redirect("/parent/unlock");
  return result;
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

export async function unlockWithPin(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const familyId = await getFamilyId();
  if (!familyId) redirect("/login");
  const result = await guard(async () => {
    const wait = pinLockedFor(familyId);
    if (wait) throw new Error(`Too many tries. Wait ${Math.ceil(wait / 60)} min.`);
    const value = pin(form);
    const stored = await repo.getPinHash(familyId);
    if (!stored) {
      // First visit: this PIN becomes the parent PIN.
      if (value !== String(form.get("confirm") ?? "")) throw new Error("PINs don't match.");
      await repo.setPinHash(familyId, hashSecret(value));
    } else {
      const ok = verifySecret(value, stored);
      recordPinAttempt(familyId, ok);
      if (!ok) throw new Error("Wrong PIN.");
    }
    await unlockParent(familyId);
  });
  if (result.ok) redirect(safeNext(form.get("next")));
  return result;
}

export async function lock() {
  await lockParent();
  redirect("/");
}

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/parent") && !s.startsWith("//") ? s : "/parent";
}
