import { HABITAT_LABELS } from "@/constants/canonical";
import type { Dinosaur, HabitatKey } from "@/types/dinosaur";
import { getActiveHabitatKeys } from "./compatibility";
import type { EnclosureProfile } from "./enclosure";

export type FeederNote = {
  text: string;
  positive?: boolean;
};

export type FeederKind =
  | "carnivore"
  | "ground-palaeobotany"
  | "tall-palaeobotany"
  | "omnivore"
  | "piscivore"
  | "shoal"
  | "shark";

export const PALEOBOTANY_KEYS: HabitatKey[] = [
  "groundLeaf",
  "groundFiber",
  "groundFruit",
  "groundNut",
  "tallLeaf",
  "tallFiber",
  "tallFruit",
];

const FEEDER_KIND_LABELS: Record<FeederKind, string> = {
  carnivore: "Carnivore",
  "ground-palaeobotany": "Ground Palaeobotany",
  "tall-palaeobotany": "Tall Palaeobotany",
  omnivore: "Omnivore",
  piscivore: "Piscivore",
  shoal: "Shoal",
  shark: "Shark",
};

const PALAEOBOTANY_KINDS = new Set<FeederKind>([
  "ground-palaeobotany",
  "tall-palaeobotany",
]);

const INFRA_KINDS = new Set<FeederKind>([
  "carnivore",
  "omnivore",
  "piscivore",
  "shoal",
  "shark",
]);

export function parseFeederKinds(feedingType: string): FeederKind[] {
  const normalized = feedingType.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized || normalized === "unknown") return [];

  const kinds = new Set<FeederKind>();
  const parts =
    feedingType.includes("/") ?
      feedingType.split("/").map((p) => p.toLowerCase().replace(/\s+/g, " ").trim())
    : [normalized];

  for (const part of parts) {
    if (part.includes("shark")) kinds.add("shark");
    if (part.includes("shoal")) kinds.add("shoal");
    if (part.includes("piscivore")) kinds.add("piscivore");
    if (part.includes("carnivore")) kinds.add("carnivore");
    if (part.includes("ground palaeobotany")) kinds.add("ground-palaeobotany");
    if (part.includes("tall palaeobotany")) kinds.add("tall-palaeobotany");
    if (part === "omnivore") kinds.add("omnivore");
  }

  if (kinds.size === 0 && normalized === "carnivore") kinds.add("carnivore");
  if (kinds.size === 0 && normalized === "omnivore") kinds.add("omnivore");
  if (kinds.size === 0 && normalized === "shoal") kinds.add("shoal");

  return [...kinds];
}

export function memberFeederKinds(members: Dinosaur[]): Set<FeederKind> {
  const kinds = new Set<FeederKind>();
  for (const member of members) {
    for (const kind of parseFeederKinds(member.feedingType)) {
      kinds.add(kind);
    }
  }
  return kinds;
}

export function paleobotanyKeys(dino: Dinosaur): HabitatKey[] {
  return getActiveHabitatKeys(dino.habitat).filter((k) =>
    PALEOBOTANY_KEYS.includes(k),
  );
}

function formatPlantList(keys: HabitatKey[]): string {
  return keys.map((k) => HABITAT_LABELS[k]).join(", ");
}

function plantsForFeederTier(
  plants: HabitatKey[],
  kind: FeederKind,
): HabitatKey[] {
  const prefix = kind === "ground-palaeobotany" ? "ground" : "tall";
  return plants.filter((k) => k.startsWith(prefix));
}

/** Terrain lines for new crops already imply a new ground/tall palaeobotany setup. */
function palaeoFeederLineRedundant(
  kind: FeederKind,
  candidatePlants: HabitatKey[],
  enclosurePlants: Set<HabitatKey>,
  newTerrainKeys: HabitatKey[],
): boolean {
  if (kind !== "ground-palaeobotany" && kind !== "tall-palaeobotany") {
    return false;
  }

  const tierPlants = plantsForFeederTier(candidatePlants, kind);
  const missingForTier = tierPlants.filter((k) => !enclosurePlants.has(k));
  if (missingForTier.length === 0) return false;

  const newTerrainSet = new Set(newTerrainKeys);
  return missingForTier.every((k) => newTerrainSet.has(k));
}

export function buildFeederDelta(
  candidate: Dinosaur,
  profile: EnclosureProfile,
  /** Paleobotany keys already shown as new terrain requirements — omit duplicate lines. */
  newTerrainKeys: HabitatKey[] = [],
): { notes: FeederNote[]; newFeedingTypes: string[] } {
  const notes: FeederNote[] = [];
  const enclosureKinds = memberFeederKinds(profile.members);
  const candidateKinds = parseFeederKinds(candidate.feedingType);

  const enclosurePlants = new Set(
    profile.envelope.activeKeys.filter((k) => PALEOBOTANY_KEYS.includes(k)),
  );
  const candidatePlants = paleobotanyKeys(candidate);
  const missingPlants = candidatePlants.filter((k) => !enclosurePlants.has(k));
  const newTerrainSet = new Set(newTerrainKeys);
  const missingPlantsNotInTerrain = missingPlants.filter(
    (k) => !newTerrainSet.has(k),
  );
  const sharedPlants = candidatePlants.filter((k) => enclosurePlants.has(k));

  const usesPalaeobotany =
    candidateKinds.some((k) => PALAEOBOTANY_KINDS.has(k)) ||
    candidatePlants.length > 0;

  if (usesPalaeobotany && candidatePlants.length > 0) {
    if (missingPlantsNotInTerrain.length > 0) {
      notes.push({
        text: `+ ${formatPlantList(missingPlantsNotInTerrain)} paleobotany needed`,
      });
    }
    if (sharedPlants.length > 0) {
      notes.push({
        text: `Shared ${formatPlantList(sharedPlants)} paleobotany`,
        positive: true,
      });
    }
  }

  for (const kind of candidateKinds.filter((k) => PALAEOBOTANY_KINDS.has(k))) {
    if (enclosureKinds.has(kind)) continue;
    if (
      palaeoFeederLineRedundant(
        kind,
        candidatePlants,
        enclosurePlants,
        newTerrainKeys,
      )
    ) {
      continue;
    }
    notes.push({
      text: `+ ${FEEDER_KIND_LABELS[kind]} feeder needed`,
    });
  }

  for (const kind of candidateKinds.filter((k) => INFRA_KINDS.has(k))) {
    if (enclosureKinds.has(kind)) {
      notes.push({
        text: `Shared ${FEEDER_KIND_LABELS[kind]} feeder`,
        positive: true,
      });
    } else {
      notes.push({
        text: `+ ${FEEDER_KIND_LABELS[kind]} feeder needed`,
      });
    }
  }

  const newFeedingTypes = profile.feedingTypes.has(candidate.feedingType)
    ? []
    : [candidate.feedingType];

  return { notes, newFeedingTypes };
}
