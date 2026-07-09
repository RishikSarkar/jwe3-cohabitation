/**
 * Patches data/raw/*.csv Likes and Dislikes from data/dinodex-cohab.json
 * (Steam DINODEX guide id=3643162109).
 */
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import fs from "fs";
import path from "path";
import {
  normalizeSpeciesName,
  slugify,
} from "../src/constants/canonical";

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const DINODEX_PATH = path.join(ROOT, "data", "dinodex-cohab.json");

type DinodexCohab = { likes?: string[]; dislikes?: string[] };

function loadDinodex(): Record<string, DinodexCohab> {
  const raw = JSON.parse(fs.readFileSync(DINODEX_PATH, "utf-8")) as Record<
    string,
    DinodexCohab | string
  >;
  const out: Record<string, DinodexCohab> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("_") || typeof value === "string") continue;
    out[key] = value;
  }
  return out;
}

function fieldFromLines(lines: string[] | undefined): string {
  if (!lines?.length) return "";
  return lines.join("\n");
}

function syncLand(dinodex: Record<string, DinodexCohab>) {
  const filePath = path.join(RAW, "land.csv");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const preamble = lines.slice(0, 2).join("\n");
  const dataContent = lines.slice(2).join("\n");

  const records = parse(dataContent, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as string[][];

  let patched = 0;
  for (const row of records) {
    if (!row[0]?.trim()) continue;
    const id = slugify(normalizeSpeciesName(row[0]));
    const entry = dinodex[id];
    if (!entry) continue;
    if (entry.likes !== undefined) {
      row[5] = fieldFromLines(entry.likes);
    }
    if (entry.dislikes !== undefined) {
      row[6] = fieldFromLines(entry.dislikes);
    }
    patched++;
  }

  const body = stringify(records, { header: false });
  fs.writeFileSync(filePath, `${preamble}\n${body}`);
  console.log(`land.csv: patched ${patched} species`);
}

function syncSimpleCsv(
  filename: string,
  likesIdx: number,
  dislikesIdx: number,
  dinodex: Record<string, DinodexCohab>,
) {
  const filePath = path.join(RAW, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as string[][];

  const [header, ...rows] = records;
  let patched = 0;
  for (const row of rows) {
    if (!row[0]?.trim()) continue;
    const id = slugify(normalizeSpeciesName(row[0]));
    const entry = dinodex[id];
    if (!entry) continue;
    if (entry.likes !== undefined) {
      row[likesIdx] = fieldFromLines(entry.likes);
    }
    if (entry.dislikes !== undefined) {
      row[dislikesIdx] = fieldFromLines(entry.dislikes);
    }
    patched++;
  }

  const out = stringify([header, ...rows], { header: false });
  fs.writeFileSync(filePath, out);
  console.log(`${filename}: patched ${patched} species`);
}

function main() {
  const dinodex = loadDinodex();
  syncLand(dinodex);
  syncSimpleCsv("aviary.csv", 3, 4, dinodex);
  syncSimpleCsv("lagoon.csv", 4, 5, dinodex);
}

main();
