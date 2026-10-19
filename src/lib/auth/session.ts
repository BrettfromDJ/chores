import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseEnabled, supabaseServer } from "../supabase/server";

/**
 * Two layers of auth:
 *  1. Family session: a parent signs in once on the device (demo: signed cookie,
 *     Supabase: Supabase Auth). Kids can then use their dashboards.
 *  2. Parent unlock: a short-lived signed cookie obtained with the parent PIN.
 *     Every admin page and every XP-affecting action requires it.
 */

const SESSION_COOKIE = "pq_session";
const PARENT_COOKIE = "pq_parent";
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
export const PARENT_TTL = 60 * 20; // 20 minutes

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production" && process.env.PQ_ALLOW_DEV_SECRET !== "1") {
    throw new Error("AUTH_SECRET must be set (16+ chars) in production.");
  }
  return "pokequest-dev-secret-do-not-use-in-production";
}

interface Token {
  fid: string;
  kind: "session" | "parent";
  exp: number;
}

function sign(token: Token) {
  const body = Buffer.from(JSON.stringify(token)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(value: string | undefined, kind: Token["kind"]): Token | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const actual = Buffer.from(mac, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const token = JSON.parse(Buffer.from(body, "base64url").toString()) as Token;
    if (token.kind !== kind || token.exp < Date.now() / 1000) return null;
    return token;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/* ---------- Family session ---------- */

export async function getFamilyId(): Promise<string | null> {
  if (supabaseEnabled) {
    const db = await supabaseServer();
    const { data } = await db.auth.getUser();
    return data.user?.id ?? null;
  }
  const store = await cookies();
  return verify(store.get(SESSION_COOKIE)?.value, "session")?.fid ?? null;
}

export async function requireFamily() {
  const familyId = await getFamilyId();
  if (!familyId) redirect("/login");
  return familyId;
}

/** Demo mode only: Supabase mode sets its own cookies via supabase.auth. */
export async function startDemoSession(familyId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign({ fid: familyId, kind: "session", exp: Math.floor(Date.now() / 1000) + SESSION_TTL }), cookieOptions(SESSION_TTL));
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PARENT_COOKIE);
  if (supabaseEnabled) {
    const db = await supabaseServer();
    await db.auth.signOut();
  }
}

/* ---------- Parent unlock ---------- */

export async function isParentUnlocked(familyId: string) {
  const store = await cookies();
  const token = verify(store.get(PARENT_COOKIE)?.value, "parent");
  return token?.fid === familyId;
}

export async function unlockParent(familyId: string) {
  const store = await cookies();
  store.set(PARENT_COOKIE, sign({ fid: familyId, kind: "parent", exp: Math.floor(Date.now() / 1000) + PARENT_TTL }), cookieOptions(PARENT_TTL));
}

export async function lockParent() {
  const store = await cookies();
  store.delete(PARENT_COOKIE);
}

/** For admin pages: redirects to the PIN screen when locked. */
export async function requireParent() {
  const familyId = await requireFamily();
  if (!(await isParentUnlocked(familyId))) redirect("/parent/unlock");
  return familyId;
}

/** For server actions: throws instead of redirecting. */
export async function assertParent() {
  const familyId = await getFamilyId();
  if (!familyId || !(await isParentUnlocked(familyId))) throw new Error("Parent PIN required.");
  return familyId;
}

/* ---------- PIN attempt throttling (per server instance) ---------- */

const attempts = ((globalThis as unknown as { __pqPin?: Map<string, { count: number; until: number }> }).__pqPin ??= new Map());

export function pinLockedFor(familyId: string) {
  const a = attempts.get(familyId);
  return a && a.until > Date.now() ? Math.ceil((a.until - Date.now()) / 1000) : 0;
}

export function recordPinAttempt(familyId: string, ok: boolean) {
  if (ok) return void attempts.delete(familyId);
  const a = attempts.get(familyId) ?? { count: 0, until: 0 };
  a.count++;
  if (a.count >= 5) {
    a.until = Date.now() + 5 * 60_000;
    a.count = 0;
  }
  attempts.set(familyId, a);
}
