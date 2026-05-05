import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Pet } from "@/lib/types";

type PetRow = {
  id: string;
  display_name: string;
  description: string;
  nft_mint: string;
  nft_name: string;
  nft_image_url: string;
  spritesheet_url: string | null;
  pet_json_url: string | null;
  status: Pet["status"];
  created_at: string;
};

function rowToPet(row: PetRow): Pet {
  return {
    id: row.id,
    displayName: row.display_name,
    description: row.description,
    nftMint: row.nft_mint,
    nftName: row.nft_name,
    nftImageUrl: row.nft_image_url,
    spritesheetUrl: row.spritesheet_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getRecentPets(limit = 6): Promise<Pet[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[pets] getRecentPets:", error.message);
    return [];
  }
  return (data ?? []).map(rowToPet);
}

export async function getAllPets(): Promise<Pet[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[pets] getAllPets:", error.message);
    return [];
  }
  return (data ?? []).map(rowToPet);
}

export async function getPet(id: string): Promise<Pet | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[pets] getPet:", error.message);
    return null;
  }
  return data ? rowToPet(data) : null;
}

export async function getPetByNftMint(mint: string): Promise<Pet | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("nft_mint", mint)
    .maybeSingle();
  if (error) {
    console.error("[pets] getPetByNftMint:", error.message);
    return null;
  }
  return data ? rowToPet(data) : null;
}

export async function getPetsByMints(mints: string[]): Promise<Pet[]> {
  if (mints.length === 0) return [];
  const supabase = getSupabaseServer();

  // Chunk to keep the URL under Cloudflare's URI size limit. A typical
  // base58 mint is ~44 chars; 100 fits comfortably under 8KB.
  const CHUNK = 100;
  const chunks: string[][] = [];
  for (let i = 0; i < mints.length; i += CHUNK) {
    chunks.push(mints.slice(i, i + CHUNK));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .in("nft_mint", chunk);
      if (error) {
        console.error("[pets] getPetsByMints chunk:", error.message);
        return [];
      }
      return (data ?? []) as PetRow[];
    }),
  );

  return results.flat().map(rowToPet);
}
