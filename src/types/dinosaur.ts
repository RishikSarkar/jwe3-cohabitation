export type EnclosureType = "Land" | "Aviary" | "Lagoon";

export type EnclosureSize = "Compact" | "Standard" | "Spacious";

export type SizeClass = "Small" | "Medium" | "Large";

export type ThreatClass =
  | "Herbivore"
  | "Carnivore"
  | "Piscivore"
  | "Omnivore"
  | "Scavenger"
  | "Marine";

export type HabitatKey =
  | "arid"
  | "barren"
  | "cover"
  | "pasture"
  | "wetland"
  | "water"
  | "deepWater"
  | "groundLeaf"
  | "groundFiber"
  | "groundFruit"
  | "groundNut"
  | "tallLeaf"
  | "tallFiber"
  | "tallFruit";

export type MetaTag =
  | "Scavenger"
  | "Carnivores"
  | "LargeCarnivores"
  | "MediumCarnivores"
  | "HybridCarnivores"
  | "Therizinosaurs";

export type CohabTag =
  | { kind: "species"; id: string }
  | { kind: "family"; id: string }
  | { kind: "meta"; tag: MetaTag }
  | { kind: "size"; size: SizeClass };

export type DinosaurSocial = {
  minPop?: number;
  maxPop?: number;
  minM?: number;
  maxM?: number;
  minF?: number;
  maxF?: number;
};

export type Dinosaur = {
  id: string;
  name: string;
  enclosureType: EnclosureType;
  feedingType: string;
  threatClass: ThreatClass;
  era: string;
  family: string;
  size: SizeClass;
  habitat: Partial<Record<HabitatKey, number>>;
  cohabitation: {
    likes: CohabTag[];
    dislikes: CohabTag[];
  };
  appeal?: number;
  appealPerHectare?: number;
  spaceGrowthPercent?: number;
  social?: DinosaurSocial;
  image: string;
  video?: string;
};

export type EnclosureMember = {
  dinosaurId: string;
  males: number;
  females: number;
};

export type EnclosureState = {
  type: EnclosureType;
  members: EnclosureMember[];
  size: EnclosureSize;
};

export type CompatibilityTier =
  | "Excellent"
  | "Good"
  | "Risky"
  | "Poor"
  | "Blocked";

export type CandidateDelta = {
  terrain: string;
  newTerrainKeys: HabitatKey[];
  diet: string;
  newFeedingTypes: string[];
  socialNotes: string[];
  space: string;
  appealNote?: string;
};

export type ScoredCandidate = {
  dinosaur: Dinosaur;
  score: number | null;
  tier: CompatibilityTier;
  blocked: boolean;
  inEnclosure: boolean;
  delta: CandidateDelta;
  breakdown: {
    habitatCosine: number;
    sharedKeyCoverage: number;
    envelopeTightness: number;
    dietCompatibility: number;
    cohabitation: number;
    spaceHeadroom: number;
  };
};

export const SIZE_WEIGHT: Record<SizeClass, number> = {
  Small: 1,
  Medium: 2,
  Large: 4,
};

export const ENCLOSURE_CAPACITY: Record<EnclosureSize, number> = {
  Compact: 14,
  Standard: 28,
  Spacious: 56,
};

export type SortMode = "compatibility" | "name";
