import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(secret, salt, 32).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifySecret(secret: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(secret, salt, expected.length);
  return timingSafeEqual(expected, actual);
}
