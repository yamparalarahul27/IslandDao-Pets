# Pet Creation Spec — The Technical Contract

This is what every Codex spirit pet is, end to end. Hitting this contract
exactly is what makes a pet installable.

## Final installable artifact

Path: `${CODEX_HOME:-$HOME/.codex}/pets/<pet-id>/`

```
<pet-id>/
├── spritesheet.webp     # 1536×1872, lossless WebP, quality=100
└── pet.json
```

`pet.json` schema (written by `package_custom_pet.py`):

```json
{
  "id": "<slug>",
  "displayName": "...",
  "description": "...",
  "spritesheetPath": "spritesheet.webp"
}
```

- `id` — slugified pet name (lowercase, alphanumeric with hyphens).
- `displayName` — human-readable name.
- `description` — free-text description.
- `spritesheetPath` — relative filename of the sprite image.

No other metadata files are written to the install directory.

## Atlas layout (compose_atlas.py)

- Canvas: **1536×1872 RGBA**, fully transparent base
  (`Image.new("RGBA", (1536, 1872), (0, 0, 0, 0))`).
- Grid: **8 cols × 9 rows** of **192×208** cells.
- Frames are **centered** in their cell, downscaled with Lanczos if
  oversized. Position: `left = col * 192 + (192 - frame_w) // 2`,
  `top = row * 208 + (208 - frame_h) // 2`.
- Unused cells stay fully transparent.
- Outputs: `final/spritesheet.png` and `final/spritesheet.webp`
  (lossless, quality=100, method=6).

### Row → state → frame-count map (ROW_SPECS)

| Row | State          | Frames |
|-----|----------------|--------|
| 0   | idle           | 6      |
| 1   | running-right  | 8      |
| 2   | running-left   | 8      |
| 3   | waving         | 4      |
| 4   | jumping        | 5      |
| 5   | failed         | 8      |
| 6   | waiting        | 6      |
| 7   | running        | 6      |
| 8   | review         | 6      |

## Pipeline overview

### Phase 1 — `prepare_pet_run.py` (scaffold)

Scaffolds a per-pet run directory:

```
run_dir/
├── references/         # copies of user-supplied refs
├── prompts/
│   ├── base-pet.md
│   └── rows/{state}.md # 9 row prompts
├── decoded/            # generated outputs land here
├── qa/
├── pet_request.json    # identity + atlas spec + style + chroma key
└── imagegen-jobs.json  # DAG: base → 9 rows; running-left can mirror running-right
```

CLI inputs: name, id, description, reference images, styling notes.
Auto-infers missing values. Picks a chroma-key background color
(magenta / cyan / yellow / etc.) by analyzing reference colors so it
won't clash with the pet's palette; can be overridden manually.

`pet_request.json` carries identity, the atlas spec (8×9, 192×208), nine
animation states with frame counts, layout guides, chroma-key choice,
and full style/effect rules. `imagegen-jobs.json` is the dependency
graph: one base job + nine row jobs, with `running-left` flagged as
deriveable from `running-right` via horizontal mirroring.

### Phase 2 — Image generation (the only Codex-coupled step)

1. Generate the **base sprite** via `$imagegen` from `prompts/base-pet.md`.
2. For each of the 9 rows, delegate to a subagent with: run dir, prompt
   file path, input images with role labels (the base sprite is the
   identity reference for cross-row consistency).
3. Subagent returns `{source_path, qa_note}`. Parent records via
   `record_imagegen_result.py`.
4. Generate `running-right` first; only mirror to `running-left` (via
   `derive_running_left_from_running_right.py`) when visually safe.

### Phase 3 — `finalize_pet_run.py` (deterministic, fully local)

Sequential steps:

1. `extract_strip_frames.py` — slice each row strip into individual
   frames using auto-detected method.
2. `inspect_frames.py` — validates frame count, identity, clean
   flat-chroma background. Writes `qa/review.json`. On failure, exits
   with repair instructions (use `queue_pet_repairs.py`).
3. `compose_atlas.py` — composites frames into the 1536×1872 atlas,
   writes `final/spritesheet.png` and `.webp`.
4. `validate_atlas.py` — writes `final/validation.json`.
5. `make_contact_sheet.py` — writes `qa/contact-sheet.png`.
6. `render_animation_videos.{py,sh}` — optional, writes `qa/videos/`
   (skip with `--skip-videos`).
7. `package_custom_pet.py` — optional, copies the spritesheet.webp +
   writes `pet.json` to `~/.codex/pets/<id>/` (skip with
   `--skip-package`).

A `qa/run-summary.json` is written and printed to stdout with success
status, all artifact paths, and the final package location.

## Acceptance criteria

- Atlas is exactly 1536×1872 (8×9 of 192×208).
- `qa/review.json` has zero errors.
- Contact sheet and (if not skipped) preview videos produced.
- Identity consistency across all rows (subagent QA + final inspection).
- Files staged at `${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/`.

## Portability note

Everything except `$imagegen` is plain Python + Pillow + ffmpeg. To run
the pipeline outside Codex you only need to swap the image-gen step for
a backend with strong identity consistency across multiple prompts —
e.g. SDXL + IP-Adapter (FaceID/Plus), a per-pet character LoRA trained
on the base, or a multi-image-conditioned model (Flux + Redux /
InstantID-style). Strip slicing, atlas compositing, QA, and packaging
work as-is.
