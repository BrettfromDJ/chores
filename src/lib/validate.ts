import { CREATURE_IDS } from "./creatures";
import type { CreatureId, Frequency } from "./types";

export class ValidationError extends Error {}

export function str(form: FormData, key: string, { max = 200, required = true } = {}) {
  const v = String(form.get(key) ?? "").trim();
  if (required && !v) throw new ValidationError(`Please fill in ${key}.`);
  if (v.length > max) throw new ValidationError(`${key} is too long (max ${max}).`);
  return v;
}

export function int(form: FormData, key: string, min: number, max: number) {
  const n = Number(form.get(key));
  if (!Number.isInteger(n) || n < min || n > max) throw new ValidationError(`${key} must be a whole number between ${min} and ${max}.`);
  return n;
}

export function frequency(form: FormData): Frequency {
  const v = form.get("frequency");
  if (v !== "daily" && v !== "weekly") throw new ValidationError("Pick daily or weekly.");
  return v;
}

export function creature(form: FormData): CreatureId {
  const v = String(form.get("creature"));
  if (!(CREATURE_IDS as string[]).includes(v)) throw new ValidationError("Pick a partner creature.");
  return v as CreatureId;
}

export function color(form: FormData) {
  const v = String(form.get("color") ?? "");
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new ValidationError("Pick a color.");
  return v;
}

export function imageUrl(form: FormData) {
  const v = str(form, "imageUrl", { max: 2000, required: false });
  if (!v) return "art:embercub";
  if (v.startsWith("art:")) {
    if (!(CREATURE_IDS as string[]).includes(v.slice(4))) throw new ValidationError("Unknown card art.");
    return v;
  }
  try {
    const url = new URL(v);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url.toString();
  } catch {
    throw new ValidationError("Image must be an http(s) link.");
  }
}

export function pin(form: FormData, key = "pin") {
  const v = String(form.get(key) ?? "");
  if (!/^\d{4,8}$/.test(v)) throw new ValidationError("PIN must be 4–8 digits.");
  return v;
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function guard(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, message: message || undefined };
  } catch (e) {
    // Next.js uses thrown errors for redirect()/notFound(); let those through.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." };
  }
}
