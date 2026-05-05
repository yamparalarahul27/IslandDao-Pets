"use server";

import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  isAdminWallet as isAdminWalletServer,
} from "@/lib/admin";
import { verifyAdminSession } from "@/lib/admin-session";
import { fetchAllPerks, type CollectionPerk } from "@/lib/perks";

export async function isCurrentWalletAdmin(
  pubkey: string | null | undefined,
): Promise<boolean> {
  return isAdminWalletServer(pubkey ?? "");
}

export async function getAdminSessionStatus(): Promise<
  { signedIn: false } | { signedIn: true; wallet: string; expSeconds: number }
> {
  const store = await cookies();
  const session = verifyAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || !isAdminWalletServer(session.wallet)) {
    return { signedIn: false };
  }
  return {
    signedIn: true,
    wallet: session.wallet,
    expSeconds: session.expSeconds,
  };
}

/**
 * Filter the cached collection by name. Returns up to 12 matches sorted
 * by perk-number ascending so "865" finds PERK #865 fast.
 */
export async function searchPerks(query: string): Promise<CollectionPerk[]> {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return [];
  const all = await fetchAllPerks();
  const matches = all.filter((p) => p.name.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const na = perkNumber(a.name);
    const nb = perkNumber(b.name);
    if (na !== null && nb !== null) return na - nb;
    return a.name.localeCompare(b.name);
  });
  return matches.slice(0, 12);
}

function perkNumber(name: string): number | null {
  const m = /#(\d+)/.exec(name);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}
