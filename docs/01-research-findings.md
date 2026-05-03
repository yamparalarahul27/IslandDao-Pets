# Research Findings

Investigation of three repositories that together describe how Codex
"spirit pets" are authored, generated, and distributed.

## 1. `sehjk/hatch-spirit-pet`

A Codex-first skill that generates animated custom pets from a concept,
art style, and action style.

- The repo's UI (`ui/`) is a **static command builder**. It does not call
  image generation, spawn sub-agents, write files, or package pets.
- README states verbatim: *"The UI is static. It prepares the run command
  only. Complete the pet in Codex, where `$imagegen` and sub-agents are
  available."*
- Workflow: open UI → enter pet details → copy generated command → run
  prep script locally → submit to Codex → Codex sub-agents do generation
  → final pet installs to `~/.codex/pets/<pet-name>/`.

Conclusion: the UI is a spec/command builder, **not** a creator. Real
work happens inside Codex runtime via the skill.

## 2. `crafter-station/petdex`

A public **gallery / directory** for Codex-compatible animated pets.

Routes:

- Browse: `/`, `/about`, `/pets/[slug]`, `/kind/[kind]`, `/vibe/[vibe]`,
  `/my-pets`, `/install/[slug]`
- "Creation": `/create` is **purely instructional**. No form, no inputs.
  It explains how to install the Hatch Pet skill and run `/pet "..."`
  inside Codex.
- Submission: `/submit` accepts a finished pet folder/zip for publication.
- Admin / API / docs / legal routes also exist.

Conclusion: Petdex's role is curation and distribution. Pet creation is
delegated entirely to Codex + the Hatch Pet skill.

## 3. `nexu-io/open-design/skills/hatch-pet` (the canonical skill)

The actual implementation. Vendored copy of the upstream Codex
`hatch-pet` skill.

### Layout

```
skills/hatch-pet/
├── SKILL.md
├── README.md
├── LICENSE.txt
├── agents/
│   └── openai.yaml
├── references/
└── scripts/
    ├── prepare_pet_run.py
    ├── generate_pet_images.py
    ├── pet_job_status.py
    ├── record_imagegen_result.py
    ├── derive_running_left_from_running_right.py
    ├── extract_strip_frames.py
    ├── inspect_frames.py
    ├── compose_atlas.py
    ├── validate_atlas.py
    ├── make_contact_sheet.py
    ├── render_animation_videos.py
    ├── render_animation_videos.sh
    ├── queue_pet_repairs.py
    ├── package_custom_pet.py
    └── finalize_pet_run.py
```

### `agents/openai.yaml` (verbatim)

```yaml
interface:
  display_name: "Hatch Pet"
  short_description: "Hatch Codex-compatible animated pet spritesheets"
  default_prompt: "Hatch a Codex-compatible animated pet from a concept, reference images, or both. Infer missing names/descriptions, use $imagegen for the base and grounded row strips, generate running-right before deciding whether running-left can be safely mirrored, then use this skill's deterministic scripts to ingest outputs, validate frames, assemble the spritesheet, and package the pet under ${CODEX_HOME:-$HOME/.codex}/pets/<pet-name>/."
```

### SKILL.md highlights

- **Triggers:** "hatch a pet", "hatch pet", "codex pet", "spritesheet
  pet", "animated pet" (plus Chinese variants).
- **Surface:** image mode, personal scenario, featured tier 3.
- **Primary output:** `final/spritesheet.png`.
- **Secondary outputs:** `final/spritesheet.webp`, `pet.json`,
  `qa/contact-sheet.png`.
- **Style contract:** pixel-art-adjacent chibi mascot, chunky readable
  silhouette, 1–2 px dark outlines, flat cel shading. No realism, no
  gradients, no antialiasing-heavy art.
- **Effect rules:** allowed effects must be state-relevant, physically
  attached to the pet, opaque, hard-edged, and small. Forbidden: detached
  sparkles, speed lines, shadows, glows, motion trails, text, UI
  elements, scenery.
- **Subagent contract:** subagents receive one row job
  (run dir + prompt file path + input images with role labels). They
  inspect for frame count, identity consistency, clean flat chroma-key
  background, and return only `{source_path, qa_note}`. They cannot edit
  manifests or package output.

The technical contract enforced by the scripts is captured in
`02-pet-creation-spec.md`.
