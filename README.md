# JWE3 Enclosure Optimizer

Fan-made tool for **Jurassic World Evolution 3** that helps you find compatible dinosaurs for an enclosure with minimal terrain and feeder changes.

Not affiliated with Frontier Developments.

## Features

- **Enclosure box** — add species with male/female counts; Land, Aviary, or Lagoon
- **Ranked species list** — compatibility scoring when the enclosure has members; name sort always available
- **Official-style UI** — topo background, Chakra Petch, JWE3 green accents
- **Official portraits & hover videos** — pulled from the JWE3 CDN (`npm run fetch-images`)
- **Row links** — click a species row to open its page on [jurassicworldevolution.com](https://www.jurassicworldevolution.com/en-US/3/dinosaurs) in a new tab
- **Shareable URLs** — full enclosure state encoded in query params
- **Deterministic scoring** — habitat cosine similarity, shared terrain coverage, explicit cohabitation rules

## Quick start

```bash
npm install
npm run import-data   # raw CSVs → clean CSVs + dinosaurs.json
npm run fetch-images  # optional: official portraits + hover .webm loops
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data pipeline

| Stage | Location | Purpose |
|-------|----------|---------|
| Raw (editable) | `data/raw/*.csv` | Spreadsheet exports |
| Clean (generated) | `data/clean/*.csv` | Normalized headers and families |
| Runtime | `src/data/dinosaurs.json` | Typed app data |

Re-run after CSV edits:

```bash
npm run import-data
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (runs `import-data` first) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run import-data` | CSV → JSON pipeline |
| `npm run fetch-images` | Download official images/videos; wiki fallback |

## Images & videos

```bash
npm run fetch-images
# npm run fetch-images -- --refresh   # re-download everything
```

Assets are saved under `public/dinosaurs/`. Species without an official listing entry show a letter fallback.

## URL format

```
/?type=Land&size=Standard&roster=triceratops:1m2f,ankylosaurus:0m1f
```

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Vitest for scoring/compatibility tests
- Static-friendly deploy (e.g. Vercel)

## Attribution

Dinosaur data from community habitat planners. Images and hover videos from the official JWE3 website CDN where available.
