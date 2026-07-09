/**
 * One-off extractor: DINODEX Steam guide text → appeal JSON.
 * Guide table layout: Name, blank, Base Appeal, blank, Population, ...
 */
import fs from "fs";
import path from "path";
import dinosaurs from "../src/data/dinosaurs.json";
import { normalizeSpeciesName, slugify } from "../src/constants/canonical";

const GUIDE_PATH =
  process.env.DINODEX_GUIDE ??
  path.join(
    process.env.USERPROFILE ?? "",
    ".cursor/projects/c-Users-rishi-Documents-Dev/agent-tools/dca3ae4b-b00e-4da8-ae57-84e751556997.txt",
  );

const OUT = path.join(__dirname, "..", "data", "dinodex-appeal.json");

const SPECIES_ALIASES: Record<string, string> = {
  "tyrannosaurus-rex": "Tyrannosaurus Rex",
  "moros-intrepidus": "Moros Intrepidus",
  "indominus-rex": "Indominus Rex",
  "scorpios-rex": "Scorpios Rex",
  ichthyosaurus: "Icthyosaurus",
};

function cleanSpeciesLine(line: string): string {
  return line
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGuideAppeals(lines: string[]): Map<string, number> {
  const map = new Map<string, number>();

  for (let i = 0; i < lines.length - 2; i++) {
    const raw = lines[i]?.trim() ?? "";
    if (!raw || raw.length > 55) continue;
    if (!/^[A-Z]/.test(raw)) continue;
    if (
      /^(Dinosaur Name|Base Appeal|Population|Likes|Dislikes|Environment|Security|Food|MARINE|HYBRID|Cohab|Intro|Males|Award|Welcome|Ornithomimids|Pachycephalosaurids|Hadrosaurids|Ceratopsids|Stegosaurids|Ankylosaurids|Sauropods|Scavengers|Small Carnivores|Medium Carnivores|Large Carnivores|Avian Reptiles|Marine Animals|Hybrids|Other)/.test(
        raw,
      )
    ) {
      continue;
    }

    const appealLine = lines[i + 2]?.trim() ?? "";
    if (!/^\d{1,4}$/.test(appealLine.replace(/,/g, ""))) continue;

    const appeal = parseInt(appealLine.replace(/,/g, ""), 10);
    if (appeal <= 0 || appeal > 9999) continue;

    const name = cleanSpeciesLine(raw);
    const id = slugify(normalizeSpeciesName(name));
    if (!map.has(id)) {
      map.set(id, appeal);
    }
  }

  return map;
}

function main() {
  if (!fs.existsSync(GUIDE_PATH)) {
    console.error("Guide not found:", GUIDE_PATH);
    process.exit(1);
  }

  const lines = fs.readFileSync(GUIDE_PATH, "utf-8").split(/\r?\n/);
  const parsed = parseGuideAppeals(lines);

  const out: Record<string, number> = {
    _source:
      "Steam DINODEX guide id=3643162109 (Kitxunei, April 2026)" as unknown as number,
  };

  const missing: string[] = [];

  for (const d of dinosaurs) {
    let appeal = parsed.get(d.id);
    if (appeal == null && SPECIES_ALIASES[d.id]) {
      appeal = parsed.get(slugify(SPECIES_ALIASES[d.id]));
    }
    if (appeal == null) {
      missing.push(d.id);
      continue;
    }
    out[d.id] = appeal;
  }

  if (missing.length > 0) {
    console.error("Missing appeal for:", missing.join(", "));
    process.exit(1);
  }

  const { _source, ...counts } = out;
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        _source:
          "Steam DINODEX guide id=3643162109 (Kitxunei, April 2026)",
        ...counts,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`Wrote ${Object.keys(counts).length} appeals → ${OUT}`);
}

main();
