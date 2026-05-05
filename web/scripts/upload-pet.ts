#!/usr/bin/env tsx
/**
 * Upload a hatched Codex pet to Supabase Storage and register a row in
 * the `pets` table.
 *
 * Usage:
 *   pnpm tsx scripts/upload-pet.ts \
 *     --pet-dir ~/.codex/pets/lavender-druid-tiger \
 *     --mint    HnpUn8kCK5dCRHNs7iXtPNuTZsLkzzk7hQfdbHSMKACn \
 *     --nft-name "IslandDAO Perks #042 — Lavender Druid Tiger" \
 *     --nft-image-url https://.../perk-tiger.png
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from .env / .env.local (gitignored).
 *
 * The pet folder must look like (from Codex Hatch):
 *   <pet-dir>/
 *     pet.json
 *     spritesheet.webp
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { argv, exit } from "node:process";

// Load .env then .env.local (later wins).
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

type Args = {
  petDir: string;
  mint: string;
  nftName: string;
  nftImageUrl?: string;
};

function parseArgs(): Args {
  const a = argv.slice(2);
  const out: Partial<Args> = {};
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    const v = a[i + 1];
    if (k === "--pet-dir") (out.petDir = v), i++;
    else if (k === "--mint") (out.mint = v), i++;
    else if (k === "--nft-name") (out.nftName = v), i++;
    else if (k === "--nft-image-url") (out.nftImageUrl = v), i++;
  }
  if (!out.petDir || !out.mint || !out.nftName) {
    console.error(
      "usage: upload-pet --pet-dir <path> --mint <addr> --nft-name <str> [--nft-image-url <url>]",
    );
    exit(1);
  }
  return out as Args;
}

async function main() {
  const { petDir, mint, nftName, nftImageUrl } = parseArgs();
  const dir = resolve(petDir.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? "~"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "[upload-pet] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
    );
    exit(1);
  }
  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_SPRITES_BUCKET ?? "pet-sprites";

  const petJsonPath = join(dir, "pet.json");
  const spritePath = join(dir, "spritesheet.webp");

  if (!existsSync(petJsonPath)) {
    console.error(`[upload-pet] pet.json not found at ${petJsonPath}`);
    exit(1);
  }
  if (!existsSync(spritePath)) {
    console.error(`[upload-pet] spritesheet.webp not found at ${spritePath}`);
    exit(1);
  }

  const petJsonText = await readFile(petJsonPath, "utf8");
  let petJson: {
    id?: string;
    displayName?: string;
    description?: string;
    spritesheetPath?: string;
  };
  try {
    petJson = JSON.parse(petJsonText);
  } catch {
    console.error("[upload-pet] pet.json is not valid JSON.");
    exit(1);
  }
  if (!petJson.id || !petJson.displayName) {
    console.error("[upload-pet] pet.json missing required fields id/displayName.");
    exit(1);
  }
  const id = petJson.id;
  const displayName = petJson.displayName;
  const description = petJson.description ?? "";

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log(`[upload-pet] uploading "${displayName}" (id=${id}) → ${bucket}`);

  const sprite = await readFile(spritePath);
  const spriteKey = `${id}/spritesheet.webp`;
  {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(spriteKey, sprite, {
        contentType: "image/webp",
        upsert: true,
      });
    if (error) {
      console.error("[upload-pet] sprite upload failed:", error.message);
      exit(1);
    }
  }

  const petJsonKey = `${id}/pet.json`;
  {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(petJsonKey, Buffer.from(petJsonText, "utf8"), {
        contentType: "application/json",
        upsert: true,
      });
    if (error) {
      console.error("[upload-pet] pet.json upload failed:", error.message);
      exit(1);
    }
  }

  const { data: spriteUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(spriteKey);
  const { data: petJsonUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(petJsonKey);
  const spritesheetUrl = spriteUrlData.publicUrl;
  const petJsonUrl = petJsonUrlData.publicUrl;

  const row = {
    id,
    display_name: displayName,
    description,
    nft_mint: mint,
    nft_name: nftName,
    nft_image_url: nftImageUrl ?? "",
    spritesheet_url: spritesheetUrl,
    pet_json_url: petJsonUrl,
    status: "ready" as const,
  };

  const { error: upsertError } = await supabase
    .from("pets")
    .upsert(row, { onConflict: "id" });
  if (upsertError) {
    console.error("[upload-pet] db upsert failed:", upsertError.message);
    exit(1);
  }

  console.log("[upload-pet] done.");
  console.log("  spritesheet:", spritesheetUrl);
  console.log("  pet.json   :", petJsonUrl);
  console.log("  detail     :", `/pets/${id}`);
}

main().catch((e) => {
  console.error(e);
  exit(1);
});
