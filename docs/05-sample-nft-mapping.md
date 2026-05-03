# Sample NFT Mapping — Lavender Druid Tiger

Concrete trait-to-pet mapping for one IslandDAO Perks NFT, used to
validate the approach in `04-islanddao-plan.md` and as the seed for the
collection-wide mapper.

## Source

- **Mint:** `HnpUn8kCK5dCRHNs7iXtPNuTZsLkzzk7hQfdbHSMKACn`
- **Collection:** Island DAO Perks (Solana, traded on Tensor)
- **Metadata URI:** `https://uploader.irys.xyz/Ho6LTnTyHEmF6RcmhciwkoyugPGX7fbgTnNYXLJAkS7p`

### Metadata JSON (verbatim)

```json
{
  "format": "pixel art",
  "traits": {
    "animal": "Tiger",
    "hat": "Druid Horn"
  },
  "creature": {
    "base": "tiger",
    "body_color": "lavender purple",
    "shading": ["dark purple outlines", "light lavender highlights"],
    "features": {
      "hat": {
        "name": "Druid Horn",
        "description": "branching tan/beige antlers wrapped with green leaves"
      },
      "eyes": "small, narrow, dark",
      "expression": "calm/neutral",
      "fur_texture": "fluffy, jagged pixel edges"
    },
    "pose": "front-facing, upper body visible"
  },
  "background": {
    "color": "soft pink",
    "style": "solid flat color"
  },
  "style": {
    "art_style": "16-bit / retro pixel art",
    "outline": "black",
    "palette": "limited, pastel-leaning"
  }
}
```

## Suitability analysis

Scored against the input-image guide (`03-input-image-guide.md`):

| Criterion | This NFT |
|---|---|
| Pixel-art style native | OK — already 16-bit pixel art, no style transfer drift |
| Limited / pastel palette | OK — ~5 dominant colors |
| Solid flat background | OK — soft pink |
| Distinct outline | OK — black |
| Identity is clear | OK — traits + creature block fully describe it |
| Full body visible | RISK — "upper body visible" only; model must invent legs for running/jumping rows |
| Single subject, centered | OK |

Verdict: this NFT maps cleanly to the hatch-pet pipeline. The only real
risk is the upper-body-only pose; mitigations below.

## Trait → `pet_request.json` mapping

For this specific NFT:

```json
{
  "id": "island-perk-lavender-tiger-druid",
  "displayName": "Lavender Druid Tiger",
  "description": "A lavender-purple pixel-art tiger wearing branching tan-and-beige antlers wrapped with green leaves. Small narrow dark eyes, calm expression, fluffy jagged-edge fur.",
  "styling_notes": [
    "16-bit retro pixel-art, hard black outlines, no antialiasing",
    "Body color: lavender purple with dark-purple shadow outlines and light-lavender highlights",
    "Druid Horn antlers must remain branching tan/beige and wrapped with green leaves on every row",
    "Fluffy, jagged pixel edges on fur silhouette",
    "Limited pastel palette — do not introduce new hues across rows",
    "Calm/neutral expression in idle, waiting, review; expression may animate in waving, jumping, failed",
    "Tiger anatomy: extrapolate plausible four-leg pixel tiger body for running/jumping rows in the same lavender palette"
  ],
  "chroma_key": "green",
  "atlas_spec": { "cols": 8, "rows": 9, "cell_w": 192, "cell_h": 208 }
}
```

Note on `chroma_key: "green"` (overriding auto-pick): the source
background is soft pink and the body has lavender-with-purple shading.
The auto-picker would likely choose green anyway, but locking it
explicitly avoids any chance of a pink-bleed alpha mistake on
highlights.

## Generalized mapper (collection-wide)

The metadata schema is regular — every IslandDAO perk follows the same
`format / traits / creature / background / style` blocks. The mapper
becomes a field rename plus a few derived fields:

```
displayName   ← f"{adjective(creature.body_color)} {traits.hat.split()[0]} {traits.animal}"
description   ← compose from creature.body_color + traits.animal + traits.hat
                 + creature.features.hat.description
                 + creature.features.eyes / expression / fur_texture
styling_notes ← style.art_style, style.outline, style.palette
                 + creature.shading
                 + creature.features (hat/eyes/expression/texture preservation rules)
                 + anatomy fallback rule if creature.pose is not "full body"
chroma_key    ← auto-pick from {green, cyan, magenta, yellow} avoiding any color
                 within 30° hue of body_color or background.color
id            ← slugify(displayName) + "-" + mint[:8]
```

Estimated implementation: ~80 lines of TypeScript. Lives in
`packages/trait-mapper/` per the plan in `04-islanddao-plan.md`.

## Codex prompt (paste-ready for this NFT)

```
Hatch a Codex-compatible animated pet using the hatch-pet skill.

Name: Lavender Druid Tiger
Slug: island-perk-lavender-tiger-druid
Description: A lavender-purple pixel-art tiger wearing branching tan-and-beige
antlers wrapped with green leaves. Small narrow dark eyes, calm expression,
fluffy jagged-edge fur.

Styling notes:
- 16-bit retro pixel-art, hard black outlines, no antialiasing
- Body color: lavender purple, dark-purple shadow outlines, light-lavender highlights
- Druid Horn antlers branching tan/beige with green leaves on EVERY row
- Fluffy jagged pixel edges on fur silhouette
- Limited pastel palette — no new hues
- Source reference shows only upper body; extrapolate a plausible four-leg
  pixel tiger body in the same lavender palette for running/jumping/failed rows
- Chroma-key background: green

Reference images:
- <attach NFT PNG>           (role: identity-front)

Run the full pipeline:
1) prepare_pet_run.py with the inputs above (chroma_key: green)
2) $imagegen for the base sprite — output FULL BODY tiger, not just upper body
3) Delegate row-strip generation to subagents for all 9 rows; generate
   running-right first, then mirror to running-left only if visually safe
4) record each $imagegen result via record_imagegen_result.py
5) finalize_pet_run.py — extract frames, inspect, compose 1536x1872 atlas,
   validate, contact sheet, videos, package

Install to ${CODEX_HOME:-$HOME/.codex}/pets/island-perk-lavender-tiger-druid/.
```

## Mitigations for the upper-body-only source

1. **The Codex prompt explicitly demands a full-body base sprite.** Once
   the base is full-body, every row inherits consistent legs/feet via
   identity conditioning.
2. If the model resists, supply a **second reference** of any generic
   pixel-art tiger full-body labeled `pose-reference` (not
   `identity-front`). The row prompts will treat it as anatomy
   guidance only and not as identity.
