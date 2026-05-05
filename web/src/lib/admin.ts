import "server-only";

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

function getAdminWallets(): string[] {
  const raw = process.env.ADMIN_WALLETS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SOLANA_ADDR.test(s));
}

/**
 * Whether `pubkey` is in the ADMIN_WALLETS allowlist. Layered on top of
 * a verified wallet session — admin auth is "session valid && this".
 */
export function isAdminWallet(pubkey: string | null | undefined): boolean {
  if (!pubkey || !SOLANA_ADDR.test(pubkey)) return false;
  return getAdminWallets().includes(pubkey);
}
