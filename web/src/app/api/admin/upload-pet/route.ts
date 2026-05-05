import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isAdminWallet } from "@/lib/admin";
import { verifyAdminSession } from "@/lib/admin-session";
import {
  getSupabaseService,
  SUPABASE_SPRITES_BUCKET,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

const SOLANA_ADDR = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;
const MAX_PET_JSON_BYTES = 256 * 1024;
const MAX_SPRITE_BYTES = 4 * 1024 * 1024;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

type PetJson = {
  id?: unknown;
  displayName?: unknown;
  description?: unknown;
};

export async function POST(req: Request) {
  // 1. Auth: cookie -> session -> wallet -> admin allowlist
  const cookieStore = await cookies();
  const session = verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  if (!session || !isAdminWallet(session.wallet)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse multipart
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const petJsonFile = form.get("pet_json");
  const spriteFile = form.get("spritesheet");
  const nftMint = String(form.get("nft_mint") ?? "");
  const nftName = String(form.get("nft_name") ?? "").slice(0, 200);
  const nftImageUrl = String(form.get("nft_image_url") ?? "").slice(0, 500);

  if (!(petJsonFile instanceof Blob) || !(spriteFile instanceof Blob)) {
    return NextResponse.json({ error: "missing_files" }, { status: 400 });
  }
  if (petJsonFile.size === 0 || petJsonFile.size > MAX_PET_JSON_BYTES) {
    return NextResponse.json({ error: "pet_json_size" }, { status: 400 });
  }
  if (spriteFile.size === 0 || spriteFile.size > MAX_SPRITE_BYTES) {
    return NextResponse.json({ error: "sprite_size" }, { status: 400 });
  }
  if (!SOLANA_ADDR.test(nftMint)) {
    return NextResponse.json({ error: "bad_mint" }, { status: 400 });
  }
  if (!nftName || !nftImageUrl) {
    return NextResponse.json({ error: "missing_nft_meta" }, { status: 400 });
  }

  // 3. Parse pet.json
  const petJsonText = await petJsonFile.text();
  let petJson: PetJson;
  try {
    petJson = JSON.parse(petJsonText) as PetJson;
  } catch {
    return NextResponse.json({ error: "pet_json_invalid" }, { status: 400 });
  }
  const id = typeof petJson.id === "string" ? petJson.id : "";
  const displayName =
    typeof petJson.displayName === "string" ? petJson.displayName : "";
  const description =
    typeof petJson.description === "string" ? petJson.description : "";
  if (!SLUG_RE.test(id)) {
    return NextResponse.json({ error: "pet_json_id" }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ error: "pet_json_name" }, { status: 400 });
  }

  // 4. Upload files to Supabase Storage
  const supabase = getSupabaseService();
  const spriteKey = `${id}/spritesheet.webp`;
  const petJsonKey = `${id}/pet.json`;

  const spriteBytes = new Uint8Array(await spriteFile.arrayBuffer());
  const spriteUpload = await supabase.storage
    .from(SUPABASE_SPRITES_BUCKET)
    .upload(spriteKey, spriteBytes, {
      contentType: "image/webp",
      upsert: true,
    });
  if (spriteUpload.error) {
    console.error("[admin-upload] sprite:", spriteUpload.error.message);
    return NextResponse.json({ error: "sprite_upload" }, { status: 500 });
  }

  const petJsonUpload = await supabase.storage
    .from(SUPABASE_SPRITES_BUCKET)
    .upload(petJsonKey, Buffer.from(petJsonText, "utf8"), {
      contentType: "application/json",
      upsert: true,
    });
  if (petJsonUpload.error) {
    console.error("[admin-upload] pet_json:", petJsonUpload.error.message);
    return NextResponse.json({ error: "pet_json_upload" }, { status: 500 });
  }

  const spritesheetUrl = supabase.storage
    .from(SUPABASE_SPRITES_BUCKET)
    .getPublicUrl(spriteKey).data.publicUrl;
  const petJsonUrl = supabase.storage
    .from(SUPABASE_SPRITES_BUCKET)
    .getPublicUrl(petJsonKey).data.publicUrl;

  // 5. Upsert the pets row
  const { error: dbError } = await supabase.from("pets").upsert(
    {
      id,
      display_name: displayName,
      description,
      nft_mint: nftMint,
      nft_name: nftName,
      nft_image_url: nftImageUrl,
      spritesheet_url: spritesheetUrl,
      pet_json_url: petJsonUrl,
      status: "ready",
    },
    { onConflict: "id" },
  );
  if (dbError) {
    console.error("[admin-upload] db:", dbError.message);
    return NextResponse.json({ error: "db_upsert" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: id });
}
