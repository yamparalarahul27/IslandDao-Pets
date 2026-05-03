# IslandDAO Perk-NFT → Pets — Proposed Plan

Goal: turn each IslandDAO perk NFT into a Codex-compatible animated
spirit pet that the NFT's current owner can install in Codex, embed on
their site, and use in other environments.

## Architecture

### 1. Trait → pet spec mapping

Each perk NFT's traits (rarity, color, role, accessories, etc.) map
deterministically to a `pet_request.json`:

- concept / description string
- palette hints
- styling notes
- chroma-key choice (or auto)

Same NFT → same pet, every time. The mapping table is the source of
truth and lives in this repo.

### 2. Generation pipeline

Use the hatch-pet pipeline as specified in
[`02-pet-creation-spec.md`](02-pet-creation-spec.md), with the
image-generation step swapped for an identity-conditioned backend:

- **Recommended:** SDXL + IP-Adapter (FaceID/Plus) using the NFT
  artwork as the identity reference, OR a per-pet character LoRA
  trained on the base sprite.
- **Alternative:** a multi-image-conditioned model
  (Flux + Redux / InstantID-style).

Output is the canonical 1536×1872 / 8×9 atlas. Strip slicing, QA, and
packaging are all unchanged from the upstream skill.

### 3. Ownership-gated claim service

Owner flow:

1. Visit the IslandDAO Pets app.
2. Connect wallet.
3. Sign a one-time message proving control of the wallet.
4. Backend verifies wallet currently holds the perk NFT.
5. Backend returns a signed download URL bundle:
   - `spritesheet.webp` + `pet.json` (Codex install)
   - other format bundles (see §4)

Claim is per-NFT. If the NFT is transferred, the new owner can claim
afresh; old download links can be revoked.

### 4. Multi-environment delivery from one atlas

One generated atlas drives every environment:

- **Codex** — drop into `~/.codex/pets/<id>/` as-is
  (`spritesheet.webp` + `pet.json`).
- **Website** — small JS sprite player (~80 LOC) using a canvas or CSS
  sprite sheet. Row = state, fps configurable per row.
- **VS Code / JetBrains** — webview using the same player.
- **Discord / OBS / desktop overlays** — export per-row APNG or WebM
  from the atlas. The skill already ships `render_animation_videos.py`.

### 5. Catalog vs on-demand generation

**Recommended:** pre-generate the entire collection once, cache on
IPFS / Arweave / R2, and let owners just claim.

- Cheaper (one-shot bill).
- Deterministic (no per-claim variance).
- Cacheable globally.

On-demand generation only makes sense if the collection is huge or
traits are open-ended. IslandDAO perk NFTs are a fixed enumerable set,
so pre-generation wins.

## Decisions

### Locked

1. **Chain + wallet stack — Solana + Phantom.** Confirmed: collection
   is on Solana (traded on Tensor). Ownership verification will use a
   Phantom signed-message flow against the wallet's current holdings of
   the perk-NFT collection.

### Still open

These drive concrete implementation choices and should be locked before
coding starts:
1. **Art fidelity target.**
   - Pet *inspired by* NFT traits (looser, easier, looks great in the
     chibi style).
   - Pet that *is* the NFT character restyled (harder; needs strong
     identity-conditioned generator and probably per-NFT LoRA tuning).
2. **Primary environment.**
   - If Codex is the main target, the upstream pipeline does ~90% of
     the work and we ship fast.
   - If most usage is web / desktop, the 9-row atlas is overkill and
     a simpler 4–6-row sheet would reduce generation cost by ~40%.
3. **Storage and funding.**
   - Who pays for generation + hosting? One-time DAO treasury spend,
     or per-claim fee?
   - Where does the catalog live? IPFS, Arweave, or a CDN bucket?
4. **Collection size and catalog source.**
   - How many perk NFTs total?
   - Where is the canonical trait metadata (mint addresses, attribute
     JSONs, original artwork URLs)?

A worked example of the trait → `pet_request.json` mapping for one
sampled NFT (Mint `HnpUn8kCK5dCRHNs7iXtPNuTZsLkzzk7hQfdbHSMKACn`,
"Lavender Druid Tiger") is in
[`05-sample-nft-mapping.md`](05-sample-nft-mapping.md). It validates
that the IslandDAO Perks metadata schema maps cleanly to the hatch-pet
pipeline with a small, regular field-rename mapper.

## Suggested MVP scope

Once the open decisions are answered, an MVP would consist of:

1. **`packages/trait-mapper`** — pure function: NFT metadata →
   `pet_request.json`.
2. **`packages/imagegen-adapter`** — replaces `$imagegen` with a real
   identity-conditioned backend.
3. **`packages/pipeline-runner`** — wraps the upstream hatch-pet
   scripts, runs the full pipeline per NFT, uploads artifacts.
4. **`apps/claim-web`** — Next.js app with wallet connect, ownership
   verification, and download bundle delivery.
5. **`packages/sprite-player`** — tiny JS player for the web embed and
   IDE webviews.
6. **Catalog job** — one-shot script that iterates the entire perk-NFT
   collection and pre-generates every pet.

No code yet — pending answers on the open decisions above.
