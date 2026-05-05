import "server-only";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

const ADMIN_LOGIN_PREFIX = "islanddao-pets:admin-login:";
const LOGIN_MAX_AGE_MS = 5 * 60_000; // 5 minutes

export const ADMIN_SESSION_COOKIE = "iddao_admin";
export const ADMIN_SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

function getAdminWallets(): string[] {
  const raw = process.env.ADMIN_WALLETS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SOLANA_ADDR.test(s));
}

export function isAdminWallet(pubkey: string | null | undefined): boolean {
  if (!pubkey || !SOLANA_ADDR.test(pubkey)) return false;
  return getAdminWallets().includes(pubkey);
}

/** Build the message the admin's wallet must sign to log in. */
export function buildAdminLoginMessage(timestampMs: number): string {
  return `${ADMIN_LOGIN_PREFIX}${timestampMs}`;
}

/** Parse the timestamp out of an admin-login message. */
export function parseAdminLoginTimestamp(message: string): number | null {
  if (!message.startsWith(ADMIN_LOGIN_PREFIX)) return null;
  const ts = Number.parseInt(message.slice(ADMIN_LOGIN_PREFIX.length), 10);
  if (!Number.isFinite(ts)) return null;
  return ts;
}

export function isLoginTimestampFresh(timestampMs: number): boolean {
  const now = Date.now();
  return Math.abs(now - timestampMs) <= LOGIN_MAX_AGE_MS;
}

/**
 * Verify that `signatureBase64` is a valid ed25519 signature of `message`
 * by the wallet whose base58 pubkey is `walletBase58`.
 */
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
