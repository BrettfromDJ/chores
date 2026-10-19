/**
 * XP is the in-game currency and it's backed by real money: 100 XP = $1, so
 * 1 XP = 1 cent. Every amount is stored as an integer number of XP (= cents).
 */

export const XP_PER_DOLLAR = 100;
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "en-US";

const full = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });
const whole = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0, minimumFractionDigits: 0 });
const count = new Intl.NumberFormat(LOCALE);

/** $1.50 — or $15 when `compact` and the amount is whole dollars. */
export function money(cents: number, { compact = false } = {}) {
  const value = cents / XP_PER_DOLLAR;
  return compact && cents % XP_PER_DOLLAR === 0 ? whole.format(value) : full.format(value);
}

/** "1,575 XP" */
export function xp(amount: number) {
  return `${count.format(amount)} XP`;
}

/** "+50 XP" / "−300 XP" */
export function signedXp(amount: number) {
  return `${amount >= 0 ? "+" : "−"}${xp(Math.abs(amount))}`;
}

/** "+$1.50" / "−$2.00" */
export function signedMoney(cents: number) {
  return `${cents >= 0 ? "+" : "−"}${money(Math.abs(cents))}`;
}

/** Parse dollar input like "1.5", "$1.50" or "2" into cents (= XP). Returns NaN when invalid. */
export function parseCents(input: string) {
  const clean = input.replace(/[^0-9.]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return NaN;
  return Math.round(Number(clean) * XP_PER_DOLLAR);
}
