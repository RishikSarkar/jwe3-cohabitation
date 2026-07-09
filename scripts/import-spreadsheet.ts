import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";
import {
  AVIARY_HABITAT_KEYS,
  COHAB_FAMILY_TAGS,
  COHAB_LINE_ALIASES,
  CSV_HEADER_TO_HABITAT,
  HABITAT_LABELS,
  LAND_HABITAT_KEYS,
  normalizeFamily,
  normalizeSize,
  normalizeSpeciesName,
  slugify,
} from "../src/constants/canonical";
import type {
  CohabTag,
  Dinosaur,
  EnclosureType,
  HabitatKey,
  ThreatClass,
} from "../src/types/dinosaur";

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const CLEAN = path.join(ROOT, "data", "clean");
const OUT = path.join(ROOT, "src", "data", "dinosaurs.json");
const DINODEX_PATH = path.join(ROOT, "data", "dinodex-cohab.json");

type DinodexCohab = { likes?: string[]; dislikes?: string[] };
type DinodexFile = Record<string, DinodexCohab>;

function loadDinodex(): DinodexFile {
  if (!fs.existsSync(DINODEX_PATH)) return {};
  const raw = JSON.parse(fs.readFileSync(DINODEX_PATH, "utf-8")) as Record<
    string,
    DinodexCohab | string
  >;
  const out: DinodexFile = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("_") || typeof value === "string") continue;
    out[key] = value;
  }
  return out;
}

function cohabLinesToField(lines: string[] | undefined): string {
  if (!lines?.length) return "";
  return lines.join("\n");
}

function applyDinodexToRow(
  row: Record<string, string>,
  dinodex: DinodexFile,
): Record<string, string> {
  const id = slugify(normalizeSpeciesName(row.DINO ?? ""));
  const entry = dinodex[id];
  if (!entry) return row;
  return {
    ...row,
    ...(entry.likes !== undefined
      ? { Likes: cohabLinesToField(entry.likes) }
      : {}),
    ...(entry.dislikes !== undefined
      ? { Dislikes: cohabLinesToField(entry.dislikes) }
      : {}),
  };
}

const LAND_HABITAT_HEADERS = LAND_HABITAT_KEYS.map((k) => HABITAT_LABELS[k]);
const AVIARY_HABITAT_HEADERS = AVIARY_HABITAT_KEYS.map((k) => HABITAT_LABELS[k]);

function deriveThreatClass(
  feedingType: string,
  family: string,
): ThreatClass {
  const ft = feedingType.toLowerCase();
  const fam = family.toLowerCase();
  if (ft.includes("shoal") || ft.includes("shark")) return "Marine";
  if (fam === "scavenger") return "Scavenger";
  if (ft.includes("omnivore")) return "Omnivore";
  if (ft.includes("piscivore")) return "Piscivore";
  if (ft.includes("carnivore") || fam === "carnivore") return "Carnivore";
  if (ft.includes("palaeobotany") || ft.includes("paleobotany")) {
    return "Herbivore";
  }
  return "Herbivore";
}

function parseCohabTags(raw: string | undefined): CohabTag[] {
  if (!raw?.trim()) return [];
  const lines = raw
    .split(/[\n\r]+/)
    .map((l) => normalizeSpeciesName(l.trim()))
    .filter(Boolean);

  const tags: CohabTag[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower === "everything" ||
      lower === "everything else" ||
      lower === "everything except hybrid carnivores" ||
      lower === "nothing" ||
      lower === "none"
    ) {
      continue;
    }
    const alias = COHAB_LINE_ALIASES[lower];
    if (alias) {
      if (alias === "Scavengers") {
        tags.push({ kind: "meta", tag: "Scavenger" });
      } else if (alias === "Therizinosaurs") {
        tags.push({ kind: "meta", tag: "Therizinosaurs" });
      } else {
        tags.push({ kind: "family", id: alias });
      }
      continue;
    }
    if (lower === "scavenger" || lower.startsWith("scavenger") || lower === "scavengers") {
      tags.push({ kind: "meta", tag: "Scavenger" });
      continue;
    }
    if (lower === "carnivores") {
      tags.push({ kind: "meta", tag: "Carnivores" });
      continue;
    }
    if (lower === "large carnivores" || lower === "large carnivore") {
      tags.push({ kind: "meta", tag: "LargeCarnivores" });
      continue;
    }
    if (lower === "medium carnivores" || lower === "medium carnivore") {
      tags.push({ kind: "meta", tag: "MediumCarnivores" });
      continue;
    }
    if (lower === "hybrid carnivores" || lower === "hybrid carnivore") {
      tags.push({ kind: "meta", tag: "HybridCarnivores" });
      continue;
    }
    if (lower === "therizinosaurs" || lower === "therizino") {
      tags.push({ kind: "meta", tag: "Therizinosaurs" });
      continue;
    }
    if (lower === "small") {
      tags.push({ kind: "size", size: "Small" });
      continue;
    }
    if (lower === "medium") {
      tags.push({ kind: "size", size: "Medium" });
      continue;
    }
    if (lower === "large") {
      tags.push({ kind: "size", size: "Large" });
      continue;
    }
    const fam = normalizeFamily(line);
    if (COHAB_FAMILY_TAGS.has(line) || COHAB_FAMILY_TAGS.has(fam)) {
      tags.push({ kind: "family", id: fam });
      continue;
    }
    tags.push({ kind: "species", id: slugify(line) });
  }
  return tags;
}

function parsePercent(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseFloat(raw.replace(/%/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function readLandCsv(): Record<string, string>[] {
  const content = fs.readFileSync(path.join(RAW, "land.csv"), "utf-8");
  const records = parse(content, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
    from_line: 3,
  }) as string[][];

  const headers = [
    "DINO",
    "Diet",
    "Era",
    "Family",
    "Size",
    "Likes",
    "Dislikes",
    ...LAND_HABITAT_HEADERS,
  ];

  return records
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });
}

function readCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];
}

function normalizeCsvHeaders(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const habitatKey = CSV_HEADER_TO_HABITAT[key.trim()];
    if (habitatKey) {
      out[HABITAT_LABELS[habitatKey]] = value;
    } else {
      out[key.trim()] = value;
    }
  }
  return out;
}

function parseHabitatFromRow(
  row: Record<string, string>,
  keys: HabitatKey[],
): Partial<Record<HabitatKey, number>> {
  const habitat: Partial<Record<HabitatKey, number>> = {};
  for (const key of keys) {
    const header = HABITAT_LABELS[key];
    const val = parsePercent(row[header]);
    if (val !== undefined && val > 0) habitat[key] = val;
  }
  return habitat;
}

function buildDinosaur(
  row: Record<string, string>,
  enclosureType: EnclosureType,
  habitatKeys: HabitatKey[],
): Dinosaur | null {
  const normalized = normalizeCsvHeaders(row);
  const name = normalizeSpeciesName(normalized.DINO ?? "");
  if (!name) return null;

  const id = slugify(name);
  const family = normalizeFamily(normalized.Family ?? "");
  const feedingType = (normalized.Diet ?? "Unknown").trim() || "Unknown";
  const likes = parseCohabTags(normalized.Likes);
  const dislikes = parseCohabTags(normalized.Dislikes);

  return {
    id,
    name,
    enclosureType,
    feedingType,
    threatClass: deriveThreatClass(feedingType, family),
    era: (normalized.Era ?? "").trim(),
    family,
    size: normalizeSize(normalized.Size ?? "Medium"),
    habitat: parseHabitatFromRow(normalized, habitatKeys),
    cohabitation: { likes, dislikes },
    image: `/dinosaurs/${id}.png`,
  };
}

function writeCleanCsv(
  filename: string,
  rows: Record<string, string>[],
  headers: string[],
) {
  fs.mkdirSync(CLEAN, { recursive: true });
  const content = stringify(rows, { header: true, columns: headers });
  fs.writeFileSync(path.join(CLEAN, filename), content);
}

function main() {
  const dinodex = loadDinodex();

  const landRows = readLandCsv()
    .map(normalizeCsvHeaders)
    .map((row) => applyDinodexToRow(row, dinodex));
  const aviaryRows = readCsv(path.join(RAW, "aviary.csv"))
    .map(normalizeCsvHeaders)
    .map((row) => applyDinodexToRow(row, dinodex));
  const lagoonRows = readCsv(path.join(RAW, "lagoon.csv"))
    .map(normalizeCsvHeaders)
    .map((row) => applyDinodexToRow(row, dinodex));

  writeCleanCsv("land.csv", landRows, [
    "DINO",
    "Diet",
    "Era",
    "Family",
    "Size",
    "Likes",
    "Dislikes",
    ...LAND_HABITAT_HEADERS,
  ]);
  writeCleanCsv("aviary.csv", aviaryRows, [
    "DINO",
    "Era",
    "Size",
    "Likes",
    "Dislikes",
    ...AVIARY_HABITAT_HEADERS,
  ]);
  writeCleanCsv("lagoon.csv", lagoonRows, [
    "DINO",
    "Diet",
    "Era",
    "Size",
    "Likes",
    "Dislikes",
  ]);

  const dinosaurs: Dinosaur[] = [];
  for (const row of landRows) {
    const d = buildDinosaur(row, "Land", [...LAND_HABITAT_KEYS]);
    if (d) dinosaurs.push(d);
  }
  for (const row of aviaryRows) {
    const d = buildDinosaur(row, "Aviary", [...AVIARY_HABITAT_KEYS]);
    if (d) dinosaurs.push(d);
  }
  for (const row of lagoonRows) {
    const d = buildDinosaur(row, "Lagoon", []);
    if (d) dinosaurs.push(d);
  }

  const seen = new Set<string>();
  const unique = dinosaurs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(unique, null, 2));

  const manifestPath = path.join(ROOT, "src", "data", "image-manifest.json");
  const videoManifestPath = path.join(ROOT, "src", "data", "video-manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf-8"),
    ) as Record<string, string | null>;
    const videoManifest = fs.existsSync(videoManifestPath)
      ? (JSON.parse(
          fs.readFileSync(videoManifestPath, "utf-8"),
        ) as Record<string, string | null>)
      : {};
    const patched = unique.map((d) => ({
      ...d,
      image: manifest[d.id] ?? d.image,
      ...(videoManifest[d.id] ? { video: videoManifest[d.id]! } : {}),
    }));
    fs.writeFileSync(OUT, JSON.stringify(patched, null, 2));
  }

  console.log(`Clean CSVs → ${CLEAN}`);
  console.log(`Imported ${unique.length} dinosaurs → ${OUT}`);
}

main();
