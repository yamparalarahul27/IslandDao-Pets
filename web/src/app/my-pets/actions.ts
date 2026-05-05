"use server";

import { getPetsByMints } from "@/lib/pets";
import { fetchOwnedPerks, walletOwnsAsset } from "@/lib/perks";
import type { OwnedNft, Pet } from "@/lib/types";

export async function lookupPetsForMints(mints: string[]): Promise<Pet[]> {
  // Defensive cap so a malicious caller can't hammer the DB.
  const safe = mints
    .slice(0, 200)
    .filter((m) => /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(m));
  if (safe.length === 0) return [];
  return getPetsByMints(safe);
}

export async function getOwnedPerks(wallet: string): Promise<OwnedNft[]> {
  return fetchOwnedPerks(wallet);
}

export async function checkWalletOwnsAsset(
  wallet: string,
  assetId: string,
): Promise<boolean> {
  return walletOwnsAsset(wallet, assetId);
}
