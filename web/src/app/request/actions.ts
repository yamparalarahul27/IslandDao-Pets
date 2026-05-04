"use server";

import { getSupabaseService } from "@/lib/supabase/server";

export type RequestInput = {
  wallet: string;
  nftMint: string;
  nftName?: string | null;
  notes?: string | null;
  email?: string | null;
};

export type RequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

export async function submitPetRequest(
  input: RequestInput,
): Promise<RequestResult> {
  const wallet = (input.wallet ?? "").trim();
  const nftMint = (input.nftMint ?? "").trim();
  const nftName = (input.nftName ?? "").trim().slice(0, 200) || null;
  const notes = (input.notes ?? "").trim().slice(0, 2000) || null;
  const emailRaw = (input.email ?? "").trim();
  const email = emailRaw ? emailRaw.slice(0, 200) : null;

  if (!SOLANA_ADDR.test(wallet)) {
    return { ok: false, error: "Invalid wallet address" };
  }
  if (!SOLANA_ADDR.test(nftMint)) {
    return { ok: false, error: "Invalid NFT mint" };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("pet_requests")
    .insert({
      wallet,
      nft_mint: nftMint,
      nft_name: nftName,
      notes,
      email,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[request] insert failed:", error.message);
    return { ok: false, error: "Could not submit request" };
  }
  return { ok: true, id: data?.id ?? "" };
}
