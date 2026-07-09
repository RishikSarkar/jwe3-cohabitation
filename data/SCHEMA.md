# `data/dinosaurs.json` — source of truth

Single canonical file for all JWE3 species data (101 species). The app loads this directly via `src/lib/dinosaur-catalog.ts` — no separate generated copy.

## Layout

| Path | Role |
|------|------|
| `data/dinosaurs.json` | **Edit this** — all species stats and roster metadata |
| `src/data/image-manifest.json` | Image paths (`npm run fetch-images`) |
| `src/data/video-manifest.json` | Hover video paths |

## Per-species fields

| Field | Purpose |
|-------|---------|
| `id`, `name` | Identity |
| `enclosureType` | `Land` \| `Aviary` \| `Lagoon` |
| `feedingType`, `era`, `family`, `size` | Roster / taxonomy |
| `general` | `appeal`, `batchSize`, `modificationsMax`, `securityRating`, `hybrid`, `activeTime`, `sex` |
| `needs` | Habitat %, prey/fish/shark, population rules |
| `attributes` | Stamina, resilience, appetite, thirst, lifespan, area need/growth |
| `preferences` | `likes`, `dislikes` (verbatim in-game text) |
| `traits` | Base trait chance % with polarity (stored; not displayed in the optimizer UI yet) |

The catalog layer derives `habitat`, `cohabitation` tags, `threatClass`, and media paths for scoring and row display.

## Hybrids

Land hybrids (`general.hybrid: true`) cannot breed and are single-sex: `indominus-rex`, `indoraptor`, `scorpios-rex`, `stegoceratops`, `spinoceratops`, `spinoraptor`, `ankylodocus`.

## Habitat keys

Land/aviary use `needs.habitat` (`arid` … `tallFruit`). Lagoon species use `openWater` in source data; the optimizer ignores terrain for lagoon enclosures.

## Workflow

```bash
npm run fetch-images   # refresh CDN assets + manifests
npm run dev
```
