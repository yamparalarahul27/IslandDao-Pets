# Input Image Guide

What an input reference image needs to look like to produce a clean pet
on the first generation run, and how to invoke the skill in Codex.

## What the reference image is used for

1. **Identity extraction** — the base sprite is generated from the
   reference, and every row strip is then conditioned on that base for
   cross-pose identity consistency.
2. **Palette extraction** — `prepare_pet_run.py` analyzes reference
   colors to pick a chroma-key background that doesn't clash with the
   pet.
3. **Pose derivation** — the model has to extrapolate idle, running,
   waving, jumping, etc. from this single reference, so the reference
   must give it enough to imagine other angles.

## Best input image — checklist

### Subject

- **One character only**, centered, occupying ~60–80% of the frame.
- **Full body visible**, feet to head. Crop-at-waist or face-only refs
  break running and jumping rows.
- **Front-facing or ¾ view.** Pure side or back views are bad — the
  model can't reconstruct the front from them.
- **Limbs slightly separated from torso** so the silhouette is clear
  and arms/legs are identifiable.

### Style and quality

- **Resolution ≥ 1024×1024**, sharp, no compression artifacts.
- **Flat or simple shading.** Hyperrealism, heavy gradients, painterly
  textures, and motion blur all fight the chibi pixel-art conversion.
- **High-contrast outline** if possible — helps the model lock onto the
  silhouette.
- **Distinct, limited palette** (3–6 dominant colors). Easier identity,
  easier chroma-key.

### Background

- **Plain, solid, or removed** (transparent PNG). Busy scenes bleed
  into the generated pet.
- Avoid backgrounds that share color with the character (a green
  character on a green field will confuse alpha extraction).

### Avoid

- Multiple characters, group shots
- Watermarks, logos, captions, signatures
- Filters, glow, lens flare, sparkles, particle effects
- Extreme perspective, fish-eye, dutch angles
- NSFW or copyrighted likenesses (will trip safety filters in
  `$imagegen`)

### Bonus inputs that improve results

- A **second reference image** at a different angle or pose. The script
  accepts multiple refs with role labels.
- An **accessory close-up** if there's a signature item (hat, staff,
  badge) — preserves it across all rows.

## Metadata to provide alongside the image

`prepare_pet_run.py` accepts: name, id, description, reference images,
styling notes. Recommended values:

- **Name + slug** — e.g. `Sock Elf` / `sock-elf`
- **One-line description** — personality + must-keep features, e.g.
  *"a tiny sock-elf with green eyes, red pointed cap, holds a brass
  key"*
- **Styling notes** — anything non-obvious to preserve, e.g.
  *"left ear is torn"*, *"always smiling"*, *"glowing left palm"*
- **Chroma key** — optional; let the script auto-pick unless the pet's
  palette is unusual

## Codex prompt template

Copy-paste this into Codex once the Hatch Pet skill is installed:

```
Hatch a Codex-compatible animated pet using the hatch-pet skill.

Name: <Display Name>
Slug: <slug-name>
Description: <one or two sentences — personality + signature features>
Styling notes: <anything that must be preserved across all rows>

Reference images:
- <path-or-attachment>  (role: identity-front)
- <optional second>      (role: identity-side or accessory-detail)

Run the full pipeline:
1) prepare_pet_run.py with the inputs above
2) $imagegen for the base sprite
3) Delegate row-strip generation to subagents for all 9 rows; generate
   running-right first, then mirror to running-left only if visually safe
4) record each $imagegen result via record_imagegen_result.py
5) finalize_pet_run.py — extract frames, inspect, compose 1536×1872 atlas,
   validate, contact sheet, videos, package

Install to ${CODEX_HOME:-$HOME/.codex}/pets/<slug-name>/.
```

## Quick "is my image good?" test

Before submitting, ask:

1. Could a stranger draw this character from a different angle using
   only this image? → identity is clear.
2. Can you trace the silhouette without ambiguity? → silhouette is
   clean.
3. Are there fewer than 6 dominant colors? → palette is manageable.
4. Is the background gone or trivially removable? → chroma extraction
   will work.

If yes to all four, expect clean rows on the first run. If any are no,
expect to repair (`queue_pet_repairs.py`) one or two rows.
