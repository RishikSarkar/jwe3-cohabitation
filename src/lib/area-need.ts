import { SIZE_WEIGHT, type Dinosaur } from "@/types/dinosaur";

export type AreaNeedEntry = {
  dinosaur: Dinosaur;
  count: number;
};

/** Each stocked species carves out its own territory — counts even at 1 adult. */
const SPECIES_TERRITORY_TAX = 5;

/** Large species need a roomy zone even as a singleton. */
const LARGE_SPECIES_FLOOR = 5;

function areaNeedMultiplier(areaNeed?: string): number {
  if (areaNeed === "MEDIUM") return 1.5;
  if (areaNeed === "HIGH") return 2;
  return 1;
}

function animalTerritoryLoad(entries: AreaNeedEntry[]): number {
  let load = 0;
  for (const { dinosaur, count } of entries) {
    if (count <= 0) continue;
    const growth = 1 + (dinosaur.spaceGrowthPercent ?? 25) / 100;
    const areaMult = areaNeedMultiplier(dinosaur.attributes?.areaNeed);
    load += count * SIZE_WEIGHT[dinosaur.size] * growth * areaMult;
  }
  return load;
}

function hasElevatedAreaNeed(entries: AreaNeedEntry[]): boolean {
  return entries.some(
    ({ dinosaur, count }) =>
      count > 0 &&
      areaNeedMultiplier(dinosaur.attributes?.areaNeed) > 1,
  );
}

/** Relative territorial demand for the stocked roster (not a map measurement). */
export function computeAreaDemandLoad(entries: AreaNeedEntry[]): number {
  const stocked = entries.filter(({ count }) => count > 0);
  if (stocked.length === 0) return 0;

  const animalLoad = animalTerritoryLoad(stocked);
  const speciesTax = stocked.length * SPECIES_TERRITORY_TAX;
  const largeFloor =
    stocked.filter(({ dinosaur }) => dinosaur.size === "Large").length *
    LARGE_SPECIES_FLOOR;

  return animalLoad + speciesTax + largeFloor;
}

export type AreaNeedStat = {
  value: string;
  label: string;
};

export const TERRITORY_SIZE_TIERS = ["XS", "S", "M", "L", "XL"] as const;
export type TerritorySizeTier = (typeof TERRITORY_SIZE_TIERS)[number];

function loadToTerritoryTier(load: number): TerritorySizeTier {
  if (load <= 10) return "XS";
  if (load <= 25) return "S";
  if (load <= 52) return "M";
  if (load <= 90) return "L";
  return "XL";
}

function bumpTerritoryTier(
  tier: TerritorySizeTier,
  steps: number,
): TerritorySizeTier {
  const index = TERRITORY_SIZE_TIERS.indexOf(tier);
  return TERRITORY_SIZE_TIERS[
    Math.min(TERRITORY_SIZE_TIERS.length - 1, index + steps)
  ]!;
}

/**
 * Qualitative territory recommendation for the banner — describes roster demand,
 * not the player's actual enclosure size.
 */
export function enclosureAreaNeedStat(entries: AreaNeedEntry[]): AreaNeedStat | null {
  if (entries.length === 0) return null;

  const load = computeAreaDemandLoad(entries);
  const elevated = hasElevatedAreaNeed(entries);

  let value = loadToTerritoryTier(load);

  if (elevated) {
    value = load <= 25 ? "XL" : bumpTerritoryTier(value, 1);
  }

  return { value, label: "territory" };
}

/** Candidate footprint note when adding one animal to an existing roster. */
export function candidateFootprintNote(
  currentLoad: number,
  candidate: Dinosaur,
): string {
  const growth = 1 + (candidate.spaceGrowthPercent ?? 25) / 100;
  const areaMult = areaNeedMultiplier(candidate.attributes?.areaNeed);
  const added = SIZE_WEIGHT[candidate.size] * growth * areaMult;

  if (added < 2) return "-";

  const ratio = currentLoad > 0 ? added / currentLoad : added;
  if (ratio > 0.25 || added >= 8) return "Adds significant footprint";
  if (ratio > 0.1 || added >= 4) return "Adds moderate footprint";
  return "-";
}
