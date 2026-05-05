import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

import { ADMIN_SESSION_TTL_SECONDS } from "@/lib/admin";

/**
 * Admin session cookie:  <wallet>.<expSeconds>.<base64url(hmac)>
 *
 * HMAC key reuses SUPABASE_SERVICE_ROLE_KEY — already a server-only secret;
 * if it's ever rotated, all admin sessions invalidate (which is correct).
 */

function getHmacKey(): Buffer {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return Buffer.from(key, "utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getHmacKey())
    .update(payload)
    .digest("base64url");
}

export function mintAdminSession(wallet: string): {
  token: string;
  expSeconds: number;
} {
  const expSeconds = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload = `${wallet}.${expSeconds}`;
  const sig = sign(payload);
  return { token: `${payload}.${sig}`, expSeconds };
}

export type AdminSession = { wallet: string; expSeconds: number };

export function verifyAdminSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [wallet, expRaw, sig] = parts;
  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(exp)) return null;
  if (Math.floor(Date.now() / 1000) >= exp) return null;
  const expected = sign(`${wallet}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return { wallet, expSeconds: exp };
}
