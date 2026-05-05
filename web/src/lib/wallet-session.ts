import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

/**
 * Single source of truth for verified wallet sessions.
 *
 *   cookie:     iddao_wallet
 *   payload:    <wallet>.<expSeconds>.<base64url(hmac)>
 *   hmac key:   SUPABASE_SERVICE_ROLE_KEY  (server-only; rotation invalidates all sessions, which is correct)
 *
 * The cookie says only "this wallet has proven private-key control."
 * Admin status is *layered on top* — the consumer checks isAdminWallet().
 */

export const WALLET_SESSION_COOKIE = "iddao_wallet";
export const WALLET_SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const VERIFY_PREFIX = "islanddao-pets:wallet-verify:";
const VERIFY_MAX_AGE_MS = 5 * 60_000; // 5 minutes

export function buildVerifyMessage(timestampMs: number): string {
  return `${VERIFY_PREFIX}${timestampMs}`;
}

export function parseVerifyTimestamp(message: string): number | null {
  if (!message.startsWith(VERIFY_PREFIX)) return null;
  const ts = Number.parseInt(message.slice(VERIFY_PREFIX.length), 10);
  return Number.isFinite(ts) ? ts : null;
}

export function isVerifyTimestampFresh(timestampMs: number): boolean {
  return Math.abs(Date.now() - timestampMs) <= VERIFY_MAX_AGE_MS;
}

/** Verify an ed25519 signature for `message` from the given wallet pubkey. */
export function verifyWalletSignature(
  message: string,
  signatureBase64: string,
  walletBase58: string,
): boolean {
  try {
    const pubkeyBytes = new PublicKey(walletBase58).toBytes();
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Uint8Array.from(
      Buffer.from(signatureBase64, "base64"),
    );
    if (signatureBytes.length !== nacl.sign.signatureLength) return false;
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      pubkeyBytes,
    );
  } catch {
    return false;
  }
}

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

export function mintWalletSession(wallet: string): {
  token: string;
  expSeconds: number;
} {
  const expSeconds =
    Math.floor(Date.now() / 1000) + WALLET_SESSION_TTL_SECONDS;
  const payload = `${wallet}.${expSeconds}`;
  const sig = sign(payload);
  return { token: `${payload}.${sig}`, expSeconds };
}

export type WalletSession = { wallet: string; expSeconds: number };

export function verifyWalletSession(
  token: string | undefined,
): WalletSession | null {
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
