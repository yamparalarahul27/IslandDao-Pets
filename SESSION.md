# Session log — IslandDAO Pets

> Living doc for picking up the build between sessions. Updated 2026-05-04.
> When you finish a session, append a new dated section at the bottom.

---

## TL;DR — current state

A Next.js 16 + Supabase app under [`web/`](web/) that:

- Reads its catalog of Pets from a Supabase `pets` table.
- Lets visitors connect a Solana wallet via Jupiter Wallet Adapter.
- Looks up their connected wallet's NFTs **(currently from a hardcoded mock — Helius is the next step)**, splits them into "Pet ready to claim" vs "Need a Pet."
- Lets unmatched holders submit a `pet_requests` row.
- Ships an `upload-pet` CLI script that pushes a hatched Codex pet into Supabase Storage and registers a `pets` row in one shot.

Live at `http://localhost:3000` after `pnpm dev` from `web/`.

---

## Architecture, one screen

```
                                    ┌─────────────────────────────┐
                                    │  Codex Hatch (offline)       │
                                    │  → spritesheet.webp + pet.json│
                                    └────────────┬─────────────────┘
                                                 │
            pnpm upload-pet  --pet-dir … --mint … --nft-name …
                                                 │
                                                 ▼
                                    ┌─────────────────────────────┐
                                    │  Supabase                    │
                                    │   • pets        (row)        │
                                    │   • pet_requests             │
                                    │   • pet-sprites bucket       │
                                    └────────────┬─────────────────┘
                                                 │ public read (anon)
                                                 │ service-role write (server actions)
                                                 ▼
   ┌──────────────────┐    Jupiter Wallet Adapter     ┌─────────────────────────────┐
   │  Browser / User  │◀──────────────────────────────▶│ Next.js 16 (web/)            │
   │                  │   ownership lookup (TODO)      │ App Router, server actions   │
   └──────────────────┘   → Helius DAS API             │  /                landing    │
                                                       │  /my-pets         gated      │
                                                       │  /pets/[id]       claim      │
                                                       │  /request         form       │
                                                       └─────────────────────────────┘
```

Brand is dark-by-default IslandDAO teal + mint, real PP Monument Extended
font, with a light/dark toggle. Real IslandDAO perk artwork lives in
[web/public/perks/](web/public/perks/) (12 zodiac PNGs).

---

## What's wired ✅

- **Stack** — Next.js 16 App Router (Turbopack), Tailwind v4, shadcn/ui (built on Base UI), Solana wallet adapter, `@supabase/supabase-js`, `next-themes`, Sonner toaster.
- **Brand** — palette + fonts pulled directly from `islanddao.org`. See [brand.md](brand.md).
- **Theme toggle** — sun/moon button in [SiteHeader](web/src/components/SiteHeader.tsx); both themes built out in [globals.css](web/src/app/globals.css).
- **Wallet** — [SolanaWalletProvider](web/src/components/providers/SolanaWalletProvider.tsx) auto-detects every Wallet-Standard wallet (Jupiter, Phantom, Solflare, Backpack…). [ConnectWalletButton](web/src/components/wallet/ConnectWalletButton.tsx) handles connect/disconnect/copy address.
- **Supabase clients** — [src/lib/supabase/server.ts](web/src/lib/supabase/server.ts) (anon + service-role, both `import "server-only"`-gated) and [src/lib/supabase/browser.ts](web/src/lib/supabase/browser.ts).
- **Repo layer** — [src/lib/pets.ts](web/src/lib/pets.ts): `getRecentPets`, `getAllPets`, `getPet`, `getPetByNftMint`, `getPetsByMints`.
- **On-chain ownership** — [src/lib/perks.ts](web/src/lib/perks.ts) holds `ISLANDDAO_PERKS_COLLECTION_MINT = 5XSXoWkcmynUSiwoi7XByRDiV9eomTgZQywgWrpYzKZ8` and two helpers: `fetchOwnedPerks(wallet)` (paged Helius DAS `getAssetsByOwner`, filtered by collection grouping) and `walletOwnsAsset(wallet, mint)` (single-asset check). Exposed to client via server actions in [src/app/my-pets/actions.ts](web/src/app/my-pets/actions.ts): `getOwnedPerks`, `checkWalletOwnsAsset`.
- **Pages**
  - [`/`](web/src/app/page.tsx) — server component, lists 6 most recent Pets, empty state when DB is empty.
  - [`/my-pets`](web/src/app/my-pets/page.tsx) — on connect, fetches real Perks holdings via Helius, then matches against the DB.
  - [`/pets/[id]`](web/src/app/pets/[id]/page.tsx) — server component; live SpritePlayer; download button gated by live `walletOwnsAsset` check.
  - [`/request`](web/src/app/request/page.tsx) — picker shows the wallet's actual Perks; submit inserts into `pet_requests` via service role.
- **SpritePlayer** — canvas-based animator at [src/components/SpritePlayer.tsx](web/src/components/SpritePlayer.tsx). Honors the 9-row × 8-col atlas (idle 6f, run-right 8f, run-left 8f, waving 4f, jumping 5f, failed 8f, waiting 6f, running 6f, review 6f).
- **Upload script** — [web/scripts/upload-pet.ts](web/scripts/upload-pet.ts), runnable as `pnpm upload-pet`.
- **`.env`** — populated locally and gitignored. Three keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## What's stubbed 🛠️

| Stub | Where | Replace with |
|---|---|---|
| **No "create signed download URL"** | Spritesheets are public-bucket URLs; download is a plain `window.location.href = pet.spritesheetUrl` | Optional: server-side ownership re-check + signed URL if you ever want to gate the file itself, not just the UI |
| **No install-script / curl-pipe endpoint** | None yet | Lift petdex's [install-script.ts](https://github.com/crafter-station/petdex/blob/main/src/lib/install-script.ts) approach for `/install/[slug]` route |
| **No `pet.zip` packaging** | `upload-pet` only uploads the two raw files | Optional: also produce + upload `<slug>.zip` for one-click download |

---

## Local setup, fresh checkout

```bash
git clone https://github.com/yamparalarahul27/IslandDao-Pets.git
cd IslandDao-Pets/web
pnpm install
cp .env.example .env       # then paste real values from password manager
pnpm dev                   # http://localhost:3000
```

`.env` is gitignored; values for this project live in:
- Supabase Studio → Settings → API
- Project ref: `bylyujxlvchlziajwzbe.supabase.co`

---

## Supabase setup — what was created

**Tables**

```sql
create table pets (
  id              text primary key,
  display_name    text not null,
  description     text not null,
  nft_mint        text not null unique,
  nft_name        text not null,
  nft_image_url   text not null,
  spritesheet_url text,
  pet_json_url    text,
  status          text not null default 'ready'
                  check (status in ('ready','in_progress','requested')),
  created_at      timestamptz not null default now()
);

alter table pets enable row level security;

create policy "pets are publicly readable"
  on pets for select using (true);

create table pet_requests (
  id           uuid primary key default gen_random_uuid(),
  wallet       text not null,
  nft_mint     text not null,
  nft_name     text,
  notes        text,
  email        text,
  status       text not null default 'pending'
               check (status in ('pending','in_progress','done','rejected')),
  created_at   timestamptz not null default now()
);

alter table pet_requests enable row level security;
-- Note: insert policy was added but the request server action uses the
-- service-role key directly (server-only), so this policy isn't load-bearing.
-- Selects from the client are blocked by default — only admins should read.
```

**Storage**
- Bucket: `pet-sprites`
- Public: ✅
- Uploads from `upload-pet` script use the service-role key.

---

## Workflows

### Adding a new Pet (you, the curator)

After hatching with the Codex skill, you'll have:
```
~/.codex/pets/<slug>/
  pet.json            # { id, displayName, description, spritesheetPath }
  spritesheet.webp    # 1536×1872, lossless
```

Run:
```bash
cd web
pnpm upload-pet \
  --pet-dir ~/.codex/pets/<slug> \
  --mint    <SOLANA_MINT_ADDRESS> \
  --nft-name "IslandDAO Perks #N — <Name>" \
  --nft-image-url https://islanddao.org/assets/perks/perk-<animal>.png
```

The script:
1. Reads `pet.json` for `id`, `displayName`, `description`.
2. Uploads `spritesheet.webp` → `pet-sprites/<slug>/spritesheet.webp`.
3. Uploads `pet.json` → `pet-sprites/<slug>/pet.json`.
4. Upserts a row into `pets` keyed by `id`.

It uses `upsert: true`, so re-running with the same `<slug>` is a safe re-publish.

### A user requesting a Pet

1. Lands on `/`.
2. Clicks "Find my Pet" → connects a wallet on `/my-pets`.
3. Sees split: matched (Pet ready to claim) vs unmatched (no Pet yet).
4. Clicks "Request Pet" on an unmatched NFT.
5. Form prefilled with their NFT mint and name; they add notes + optional email.
6. Submit → server action validates → `pet_requests` row inserted.

You can then watch the `pet_requests` table in Supabase Studio for new asks.

### A holder claiming a Pet

1. Connects wallet on `/my-pets`.
2. "Pet ready to claim" card → click → `/pets/<slug>`.
3. Detail page shows live SpritePlayer + spec.
4. Sidebar "Download spritesheet" — gated to require the connected wallet to hold the NFT (currently mock-checked, will be Helius-checked next).

---

## Next session — pick one

Helius is wired. Sensible directions, in rough order of value:

1. **Upload a real hatched Pet** end-to-end (`pnpm upload-pet …`) and walk through it as the holder of one Perk: connect → see "Pet ready" → claim → download → install in Codex.
2. **petdex-style install command** — add `/install/[slug]/route.ts` that emits a POSIX/PowerShell installer script; lift logic from petdex's [install-script.ts](https://github.com/crafter-station/petdex/blob/main/src/lib/install-script.ts). Show it as a copy-paste card on the pet detail page.
3. **CSS sprite player** — replace the canvas [SpritePlayer](web/src/components/SpritePlayer.tsx) with petdex's [pet-sprite.tsx](https://github.com/crafter-station/petdex/blob/main/src/components/pet-sprite.tsx) for SSR-friendly thumbnails and per-row fps from `ROW_SPECS`.
4. **Admin view at `/admin/requests`** — table of `pet_requests` you can triage, gated by env var `ADMIN_WALLETS` (comma-separated pubkeys).
5. **`pet.zip` packaging** in `upload-pet` — bundles `spritesheet.webp` + `pet.json` for one-click download.
6. **30s LRU cache** around `fetchOwnedPerks` keyed by wallet, so rapid reloads don't burn Helius quota.
7. **Tensor floor / last-sale** on the pet detail sidebar (needs Tensor API key).

---

## Reference repos and docs

- **Codex Hatch spec** — [docs/02-pet-creation-spec.md](docs/02-pet-creation-spec.md). Atlas: 1536×1872, 8×9 grid, 192×208 cells. Source of truth for the SpritePlayer.
- **petdex** — https://github.com/crafter-station/petdex. Borrowed: `pet-states.ts` mapping (matches our `ROW_SPECS`), CSS-based sprite player approach (worth swapping to later — smaller, SSR-friendly than the canvas one), install-script generator pattern for the curl-pipe installer.
- **character-animation-creator-skill** — https://github.com/tachikomared/character-animation-creator-skill. Different pipeline (8-direction movement, 64×64 cells) — reference only, not used here.
- **Sprite-Pipeline** — https://github.com/LayrKits/Sprite-Pipeline. Video-to-spritesheet pipeline; useful if you ever switch to video-derived sources.
- **Helius DAS API** — https://docs.helius.dev/das-api/get-assets-by-owner.
- **Tensor API** — https://dev.tensor.trade/reference/getuserportfoliocollections (alternative to Helius; gated by `x-tensor-api-key`; we picked Helius).
- **IslandDAO official site** — https://islanddao.org (palette + fonts source).

---

## Session history

### 2026-05-05 — Helius DAS integration

- Confirmed IslandDAO Perks collection mint `5XSXoWkcmynUSiwoi7XByRDiV9eomTgZQywgWrpYzKZ8` resolves on Helius DAS as a `MplCoreCollection` ("PERK"), and that `getAssetsByGroup` filtered by collection returns items as expected.
- Added [src/lib/perks.ts](web/src/lib/perks.ts) with the collection constant and two server-only helpers: paged `fetchOwnedPerks(wallet)` and single-asset `walletOwnsAsset(wallet, mint)`.
- Exposed both via server actions in [src/app/my-pets/actions.ts](web/src/app/my-pets/actions.ts) (`getOwnedPerks`, `checkWalletOwnsAsset`).
- Swapped `MOCK_OWNED_NFTS` for live data in `/my-pets`, `/request`, and the pet detail download gate.
- Deleted [src/lib/mock.ts](web/src/lib/mock.ts) and the temporary probe scripts.
- TS clean, all routes 200/404, server action verified firing in dev log.

### 2026-05-04 — initial build + Supabase wiring

- Scaffolded Next.js 16 + Tailwind v4 + shadcn under `web/`.
- Pulled IslandDAO palette and fonts (PP Monument Extended, Deutschlander) from `islanddao.org` — self-hosted in `web/public/fonts/`.
- Downloaded all 12 perk artworks to `web/public/perks/`.
- Built landing, my-pets, pets/[id], request pages with mock data.
- Added `next-themes` light/dark toggle.
- Set up Supabase project, `pets` + `pet_requests` tables, `pet-sprites` storage bucket.
- Wired live Supabase reads in landing + pet detail.
- Wired `submitPetRequest` server action for `/request`.
- Wired `lookupPetsForMints` server action for `/my-pets`.
- Wrote `scripts/upload-pet.ts` + `pnpm upload-pet` script.
