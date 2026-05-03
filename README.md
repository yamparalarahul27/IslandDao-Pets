# IslandDAO Perk-NFT → Codex Pets

Investigation and proposed plan for converting IslandDAO perk NFTs into
Codex-compatible animated "spirit pets" that owners can install in Codex,
embed on websites, and use across other environments.

## Documents

- [`docs/01-research-findings.md`](docs/01-research-findings.md) — What
  `sehjk/hatch-spirit-pet`, `crafter-station/petdex`, and the canonical
  `nexu-io/open-design` hatch-pet skill actually do.
- [`docs/02-pet-creation-spec.md`](docs/02-pet-creation-spec.md) — The
  deterministic technical contract: atlas layout, animation rows, pipeline
  scripts, `pet.json` schema, install path.
- [`docs/03-input-image-guide.md`](docs/03-input-image-guide.md) — What an
  input reference image needs to look like to produce a clean pet on the
  first run, plus the Codex prompt template.
- [`docs/04-islanddao-plan.md`](docs/04-islanddao-plan.md) — Proposed
  architecture for turning each perk NFT into a claimable, ownership-gated
  pet usable in Codex, on websites, and in other environments.

## Status

Research complete. No code yet. Open decisions are tracked at the bottom of
`docs/04-islanddao-plan.md`.
