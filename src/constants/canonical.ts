import type { HabitatKey } from "@/types/dinosaur";

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
  "Pachycephalosaur",
  "Pachy",
  "Stegosaurid",
  "Carnivores",
  "Therizinosaurs",
  "Scavenger",
  "Large",
  "Medium",
  "Small",
]);

/** JWE3 medium carnivore roster (DINODEX guide). */
export const MEDIUM_CARNIVORE_IDS = new Set([
  "ceratosaurus",
  "qianzhousaurus",
  "carnotaurus",
  "yutyrannus",
  "concavenator",
  "baryonyx",
  "albertosaurus",
  "irritator",
  "metriacanthosaurus",
  "suchomimus",
  "allosaurus",
]);

export const HYBRID_CARNIVORE_IDS = new Set([
  "spinoraptor",
  "scorpios-rex",
  "indominus-rex",
  "indoraptor",
]);

/** DINODEX shorthand in likes/dislikes columns. */
export const COHAB_LINE_ALIASES: Record<string, string> = {
  ornithomimids: "Ornithomimosaurid",
  ceratopsids: "Ceratopsid",
  hadrosaurs: "Hadrosaurid",
  hadrosaurids: "Hadrosaurid",
  ankys: "Ankylosaurid",
  ankylosaurids: "Ankylosaurid",
  stegos: "Stegosaurid",
  stegosaurids: "Stegosaurid",
  pachys: "Pachycephalosaurid",
  sauropods: "Sauropod",
  therizino: "Therizinosaurs",
  therizinosaurus: "Therizinosaurs",
  scavengers: "Scavengers",
};

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

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
