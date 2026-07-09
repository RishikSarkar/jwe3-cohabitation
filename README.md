# JWE3 Enclosure Optimizer

Fan-made tool for **Jurassic World Evolution 3** that helps you find compatible dinosaurs for an enclosure with minimal terrain and feeder changes.

Not affiliated with Frontier Developments.

## Features

- **Enclosure box**: add species with male/female counts; Land, Aviary, or Lagoon
- **Per-type memory**: each enclosure type keeps its own roster in the browser; sort mode and “show blocked” persist across visits
- **Enclosure stats banner**: compatibility score and tier (left), centered headcount (middle), and total base appeal (right) when stocked
- **Member row controls**: Mars/Venus icons with ± stepper buttons for male/female counts; Remove aligned with the same spacing as Add on candidate rows
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

`npm run setup` fetches official images/videos if needed. Species portraits for all 101 dinosaurs are committed under `public/dinosaurs/`; re-run setup only when adding species or refreshing CDN assets.

Open [http://localhost:3000](http://localhost:3000).

## Data

| Path | Role |
|------|------|
| `data/dinosaurs.json` | **Source of truth** — in-game stats for all 101 species |
| `src/lib/dinosaur-catalog.ts` | Loads source JSON and derives optimizer fields (habitat, cohab tags, threat class, media) |
| `src/hooks/use-enclosure-session.ts` | URL + `localStorage` session (per-type rosters, sort, show blocked) |
| `src/lib/enclosure-storage.ts` | Browser persistence for enclosure rosters and UI prefs |
| `src/data/image-manifest.json` | Local image paths (`npm run fetch-images`) |
| `src/data/video-manifest.json` | Hover video paths |

Edit `data/dinosaurs.json` and refresh the dev server — no import/build step for stat changes.

**Browser persistence:** Land, Aviary, and Lagoon rosters are saved separately in `localStorage` (plus sort mode and “show blocked”). Switching enclosure type restores each list; shared `?roster=` URLs still override the matching type on load.

Trait chances are stored per species but **not shown in the UI yet** (optimizer uses habitat, feeders, and cohabitation only).

**Assets:** Dinosaur portraits and hover videos under `/dinosaurs/*` are served with long-lived cache headers; images lazy-load in the species list.

See `data/SCHEMA.md` for the full field reference.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Fetch images/videos (one command) |
| `npm run dev` | Start dev server |
| `npm run build` | Production build (used by Vercel) |
| `npm run start` | Serve production build |
| `npm run test` | Vitest unit tests (`tests/lib/`) |
| `npm run test:coverage` | Vitest with coverage report |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
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

- Species stats from in-game JWE3 INFO panels (base game)
- Images and hover videos from the official JWE3 website CDN where available
