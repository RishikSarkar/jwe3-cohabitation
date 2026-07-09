# JWE3 Enclosure Optimizer

Fan-made tool for **Jurassic World Evolution 3** that helps you find compatible dinosaurs for an enclosure with minimal terrain and feeder changes.

Not affiliated with Frontier Developments.

## Features

- **Enclosure box**: add species with male/female counts; Land, Aviary, or Lagoon
- **Enclosure stats banner**: compatibility score and tier, headcount, and total base appeal when stocked
- **Ranked species list**: compatibility, recommended (80% compat + 20% appeal), appeal, or name sort
- **Candidate row details**: consolidated social notes (liked by, mutual likes, dislikes), terrain requirements, and feeder/paleobotany deltas without duplicate lines
- **Compatibility breakdown tooltip**: hover a candidate score to see weighted factor subscores (habitat match, feeders, envelope fit, etc.), color-coded like the main tier
- **Family group search**: regex filter by name, id, or family shorthand (`ceratops`, `hadrosaur`, `marine`, `aviary`, etc.)
- **Show blocked toggle**: hides social blocks by default; blocked species remain addable with dislike warnings shown in-row
- **Feeder-aware scoring**: diet/feeder mismatches lower compatibility but do not hard-block (only explicit social dislikes block)
- **Official-style UI**: topo background, Chakra Petch, JWE3 green accents, themed sort dropdown
- **Official portraits and hover videos**: pulled from the JWE3 CDN
- **Row links**: click a species row to open its page on [jurassicworldevolution.com](https://www.jurassicworldevolution.com/en-US/3/dinosaurs) in a new tab
- **Shareable URLs**: full enclosure state encoded in query params (invalid roster entries are sanitized on load)
- **Deterministic scoring**: habitat cosine similarity, shared terrain coverage, envelope tightness, feeders, cohabitation, and space headroom

## Scoring notes

Detail lines on each row show **what is new** (terrain types, feeder stations, paleobotany crops). The compatibility score also reflects **how much the current habitat mix must shift**, even when no new terrain type is required — hover the score for the breakdown.

Feeder notes distinguish:

- **Shared paleobotany** / **shared feeder** (green) when the enclosure already supports them
- **New terrain** (e.g. `+ Wetland required`) when a habitat key is missing
- **New feeder station** (e.g. `+ Carnivore feeder needed`) when infrastructure is missing but crops are not already listed as new terrain

## Quick start

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` imports spreadsheet data and downloads official images/videos. On Vercel, `npm run build` runs the data import automatically; assets in `public/dinosaurs/` are already in the repo.

Open [http://localhost:3000](http://localhost:3000).

## Data pipeline

| Stage | Location | Purpose |
|-------|----------|---------|
| Cohab reference | `data/dinodex-cohab.json` | Likes/dislikes from the [Steam DINODEX guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3643162109) |
| Appeal reference | `data/dinodex-appeal.json` | Base appeal per species from the same DINODEX guide |
| Raw (editable) | `data/raw/*.csv` | Spreadsheet exports (habitat percentages; cohab synced from DINODEX) |
| Clean (generated) | `data/clean/*.csv` | Normalized headers and families |
| Runtime | `src/data/dinosaurs.json` | Typed app data |

`npm run import-data` runs `sync-dinodex` first, which patches raw CSV likes/dislikes from `dinodex-cohab.json`, then builds clean CSVs and `dinosaurs.json`.

To update cohabitation rules, edit `data/dinodex-cohab.json` and run `npm run import-data` (or `npm run setup`).

To refresh base appeal values, edit `data/dinodex-appeal.json` (or run `scripts/extract-dinodex-appeal.ts`) and run `npm run import-data`.

Habitat percentages still come from the raw CSVs. Cohabitation likes and dislikes are owned by the DINODEX cohab file. Base appeal is imported from `dinodex-appeal.json`, shown on candidate rows and as total enclosure base appeal in the banner.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Import data and fetch images/videos (one command) |
| `npm run dev` | Import data, then start dev server |
| `npm run build` | Import data, then production build (used by Vercel) |
| `npm run start` | Serve production build |
| `npm run test` | Vitest unit tests |
| `npm run test:coverage` | Vitest with coverage report |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run sync-dinodex` | Patch raw CSV cohab columns from `dinodex-cohab.json` |
| `npm run import-data` | Sync DINODEX, then CSV to JSON |
| `npm run fetch-images` | Download images/videos only |

Refresh assets: `npm run fetch-images -- --refresh`

## URL format

```
/?type=Land&size=Standard&roster=triceratops:1m2f,ankylosaurus:0m1f
```

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Vitest for scoring, compatibility, feeder delta, and URL state tests
- Deployable on Vercel (`npm run build`)

## Attribution

- Habitat percentages from community spreadsheet exports
- Cohabitation likes/dislikes and base appeal from [DINODEX // Jurassic World Evolution 3 Full Dino Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3643162109) by Kitxunei
- Images and hover videos from the official JWE3 website CDN where available
