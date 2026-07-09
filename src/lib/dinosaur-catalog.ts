import source from "@data/dinosaurs.json";
import imageManifest from "@/data/image-manifest.json";
import videoManifest from "@/data/video-manifest.json";
import {
  AVIARY_HABITAT_KEYS,
  COHAB_FAMILY_TAGS,
  COHAB_LINE_ALIASES,
  LAND_HABITAT_KEYS,
  normalizeFamily,
  normalizeSpeciesName,
} from "@/constants/canonical";
import type {
  CohabTag,
  Dinosaur,
  DinosaurSourceFile,
  EnclosureType,
  HabitatKey,
  SourceSpecies,
  ThreatClass,
} from "@/types/dinosaur";

function deriveThreatClass(feedingType: string, family: string): ThreatClass {
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

export function parseCohabLines(lines: string[]): CohabTag[] {
  const tags: CohabTag[] = [];
  for (const raw of lines) {
    const line = normalizeSpeciesName(raw.trim());
    if (!line) continue;
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
    if (
      lower === "scavenger" ||
      lower.startsWith("scavenger") ||
      lower === "scavengers"
    ) {
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
    tags.push({
      kind: "species",
      id: line
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    });
  }
  return tags;
}

function habitatKeysFor(enclosureType: EnclosureType): HabitatKey[] {
  if (enclosureType === "Aviary") return [...AVIARY_HABITAT_KEYS];
  if (enclosureType === "Land") return [...LAND_HABITAT_KEYS];
  return [];
}

function parseHabitat(
  raw: Record<string, number> | undefined,
  enclosureType: EnclosureType,
): Partial<Record<HabitatKey, number>> {
  if (!raw) return {};
  const allowed = new Set(habitatKeysFor(enclosureType));
  const habitat: Partial<Record<HabitatKey, number>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "openWater") continue;
    if (!allowed.has(key as HabitatKey)) continue;
    if (value > 0) habitat[key as HabitatKey] = value;
  }
  return habitat;
}

function buildDinosaur(sp: SourceSpecies): Dinosaur | null {
  if (!sp.enclosureType) return null;

  const feedingType = sp.feedingType?.trim() || "Unknown";
  const family = sp.family?.trim() || "Unknown";
  const era = sp.era?.trim() || "";
  const size = sp.size ?? "Medium";

  const images = imageManifest as Record<string, string | null>;
  const videos = videoManifest as Record<string, string | null>;

  const dinosaur: Dinosaur = {
    id: sp.id,
    name: sp.name,
    enclosureType: sp.enclosureType,
    feedingType,
    threatClass: deriveThreatClass(feedingType, family),
    era,
    family,
    size,
    habitat: parseHabitat(sp.needs?.habitat, sp.enclosureType),
    cohabitation: {
      likes: parseCohabLines(sp.preferences?.likes ?? []),
      dislikes: parseCohabLines(sp.preferences?.dislikes ?? []),
    },
    image: images[sp.id] ?? `/dinosaurs/${sp.id}.png`,
    ...(videos[sp.id] ? { video: videos[sp.id]! } : {}),
    ...(sp.general ? { general: sp.general } : {}),
    ...(sp.needs ? { needs: sp.needs } : {}),
    ...(sp.attributes ? { attributes: sp.attributes } : {}),
    ...(sp.preferences ? { preferences: sp.preferences } : {}),
    ...(sp.traits?.length ? { traits: sp.traits } : {}),
  };

  if (sp.general?.appeal != null) dinosaur.appeal = sp.general.appeal;
  if (sp.attributes?.areaNeedGrowthPercent != null) {
    dinosaur.spaceGrowthPercent = sp.attributes.areaNeedGrowthPercent;
  }

  return dinosaur;
}

const file = source as DinosaurSourceFile;

export function getSourceFile(): DinosaurSourceFile {
  return file;
}

export function getAllDinosaurs(): Dinosaur[] {
  return file.species
    .map(buildDinosaur)
    .filter((d): d is Dinosaur => d != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const allDinosaurs: Dinosaur[] = getAllDinosaurs();
