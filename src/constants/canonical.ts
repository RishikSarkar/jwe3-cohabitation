import type { HabitatKey, SizeClass } from "@/types/dinosaur";

/** Canonical habitat keys — single source of truth for import, math, and UI. */
export const HABITAT_KEYS = [
  "arid",
  "barren",
  "cover",
  "pasture",
  "wetland",
  "water",
  "deepWater",
  "groundLeaf",
  "groundFiber",
  "groundFruit",
  "groundNut",
  "tallLeaf",
  "tallFiber",
  "tallFruit",
] as const satisfies readonly HabitatKey[];

export const HABITAT_LABELS: Record<HabitatKey, string> = {
  arid: "Arid",
  barren: "Barren",
  cover: "Cover",
  pasture: "Pasture",
  wetland: "Wetland",
  water: "Water",
  deepWater: "Deep Water",
  groundLeaf: "Ground Leaf",
  groundFiber: "Ground Fiber",
  groundFruit: "Ground Fruit",
  groundNut: "Ground Nut",
  tallLeaf: "Tall Leaf",
  tallFiber: "Tall Fiber",
  tallFruit: "Tall Fruit",
};

/** Maps messy CSV header variants → canonical HabitatKey. */
export const CSV_HEADER_TO_HABITAT: Record<string, HabitatKey> = {
  Arid: "arid",
  Barren: "barren",
  Cover: "cover",
  Pasture: "pasture",
  Wetland: "wetland",
  Water: "water",
  "Deep Water": "deepWater",
  "Ground Leaf": "groundLeaf",
  "Ground Fiber": "groundFiber",
  "Ground Fruit": "groundFruit",
  "Ground Nut": "groundNut",
  "Tall leaf": "tallLeaf",
  "Tall Leaf": "tallLeaf",
  "Tall Fiber": "tallFiber",
  "Tall Fruit": "tallFruit",
};

export const LAND_HABITAT_KEYS = HABITAT_KEYS;

export const AVIARY_HABITAT_KEYS: HabitatKey[] = [
  "arid",
  "barren",
  "cover",
  "pasture",
  "wetland",
  "water",
];

export const FAMILY_ALIASES: Record<string, string> = {
  ceratops: "Ceratopsid",
  ceratopsid: "Ceratopsid",
  hadrosaur: "Hadrosaurid",
  hadrosaurid: "Hadrosaurid",
  pachy: "Pachycephalosaurid",
  pachycephalosaurid: "Pachycephalosaurid",
  sauropod: "Sauropod",
  ornithomimosaurid: "Ornithomimosaurid",
  ankylosaurid: "Ankylosaurid",
  stegosaurid: "Stegosaurid",
  carnivore: "Carnivore",
  therapod: "Carnivore",
  scavanger: "Scavenger",
  therizinosaurus: "Therizinosaurid",
  hybrid: "Hybrid",
  dimetrodon: "Dimetrodon",
  deinocheirus: "Deinocheirus",
};

/** Known CSV species-name typos → canonical display name (import only). */
export const SPECIES_NAME_ALIASES: Record<string, string> = {
  "inominus rex": "Indominus rex",
  indoraptor: "Indoraptor",
  "scorpois rex": "Scorpios rex",
  stegpceratpops: "Stegoceratops",
  ankyloducus: "Ankylodocus",
};

export const COHAB_FAMILY_TAGS = new Set([
  "Sauropod",
  "Ornithomimosaurid",
  "Ceratopsid",
  "Ceratops",
  "Ankylosaurid",
  "Hadrosaurid",
  "Hadrosaur",
  "Pachycephalosaurid",
  "Pachy",
  "Stegosaurid",
  "Carnivores",
  "Therizinosaurs",
  "Scavenger",
  "Large",
  "Medium",
  "Small",
]);

export function normalizeFamily(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Unknown";
  return FAMILY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export function normalizeSpeciesName(raw: string): string {
  const trimmed = raw.trim().replace(/\u00ad/g, "");
  const key = trimmed.toLowerCase();
  return SPECIES_NAME_ALIASES[key] ?? trimmed;
}

export function normalizeSize(raw: string): SizeClass {
  const s = raw.trim().toLowerCase();
  if (s === "small") return "Small";
  if (s === "large") return "Large";
  return "Medium";
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
