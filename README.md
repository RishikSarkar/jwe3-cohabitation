# JWE3 Enclosure Optimizer

Fan-made tool for **Jurassic World Evolution 3** that helps you find compatible dinosaurs for an enclosure with minimal terrain and feeder changes.

Not affiliated with Frontier Developments.

## Features

- **Enclosure box**: add species with male/female counts; Land, Aviary, or Lagoon
- **Ranked species list**: compatibility scoring when the enclosure has members; name sort always available
- **Official-style UI**: topo background, Chakra Petch, JWE3 green accents
- **Official portraits and hover videos**: pulled from the JWE3 CDN
- **Row links**: click a species row to open its page on [jurassicworldevolution.com](https://www.jurassicworldevolution.com/en-US/3/dinosaurs) in a new tab
- **Shareable URLs**: full enclosure state encoded in query params
- **Deterministic scoring**: habitat cosine similarity, shared terrain coverage, explicit cohabitation rules

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
| Raw (editable) | `data/raw/*.csv` | Spreadsheet exports |
| Clean (generated) | `data/clean/*.csv` | Normalized headers and families |
| Runtime | `src/data/dinosaurs.json` | Typed app data |

After CSV edits, run `npm run setup` or `npm run import-data`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Import data and fetch images/videos (one command) |
| `npm run dev` | Import data, then start dev server |
| `npm run build` | Import data, then production build (used by Vercel) |
| `npm run start` | Serve production build |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run import-data` | CSV to JSON only |
| `npm run fetch-images` | Download images/videos only |

Refresh assets: `npm run fetch-images -- --refresh`

## URL format

```
/?type=Land&size=Standard&roster=triceratops:1m2f,ankylosaurus:0m1f
```

## Tech stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Vitest for scoring/compatibility tests
- Deployable on Vercel (`npm run build`)

## Attribution

Dinosaur data from community habitat planners. Images and hover videos from the official JWE3 website CDN where available.
