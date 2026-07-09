export type EnclosureType = "Land" | "Aviary" | "Lagoon";

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

export type SpeciesTrait = {
  name: string;
  percent: number;
  polarity?: string;
};

export type SpeciesGeneral = {
  appeal?: number;
  batchSize?: { min?: number; max?: number };
  modificationsMax?: number;
  securityRating?: number;
  hybrid?: boolean;
  activeTime?: string[];
  sex?: string[];
};

export type SpeciesNeeds = {
  habitat?: Record<string, number>;
  openWater?: number;
  prey?: number;
  fish?: number;
  shark?: number;
  adultPopulation?: { min?: number; note?: string };
  adultMales?: string;
  adultFemales?: string;
  juvenilePopulation?: string;
  canBreed?: boolean;
  singleSex?: "female" | "male";
};

export type SpeciesAttributes = {
  maxStamina?: string;
  resilience?: string;
  appetite?: string;
  thirst?: string;
  lifespan?: { min?: number; max?: number };
  areaNeed?: string;
  areaNeedGrowthPercent?: number;
};

export type SpeciesPreferences = {
  likes?: string[];
  dislikes?: string[];
};

export type SourceSpecies = {
  id: string;
  name: string;
  enclosureType?: EnclosureType;
  feedingType?: string;
  era?: string;
  family?: string;
  size?: SizeClass;
  general?: SpeciesGeneral;
  needs?: SpeciesNeeds;
  attributes?: SpeciesAttributes;
  preferences?: SpeciesPreferences;
  traits?: SpeciesTrait[];
};

export type DinosaurSourceFile = {
  meta: {
    version: number;
    speciesCount: number;
    rosterCount?: number;
    hybridCount?: number;
  };
  species: SourceSpecies[];
};

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
  general?: SpeciesGeneral;
  needs?: SpeciesNeeds;
  attributes?: SpeciesAttributes;
  preferences?: SpeciesPreferences;
  traits?: SpeciesTrait[];
};

export type EnclosureMember = {
  dinosaurId: string;
  males: number;
  females: number;
};

export type EnclosureState = {
  type: EnclosureType;
  members: EnclosureMember[];
};

export type CompatibilityTier =
  | "Excellent"
  | "Good"
  | "Risky"
  | "Poor"
  | "Incompatible";

export type FeederDeltaNote = {
  text: string;
  positive?: boolean;
};

export type CandidateDelta = {
  terrain: string;
  newTerrainKeys: HabitatKey[];
  feederNotes: FeederDeltaNote[];
  newFeedingTypes: string[];
  socialNotes: string[];
  space: string;
};

export type ScoredCandidate = {
  dinosaur: Dinosaur;
  score: number | null;
  tier: CompatibilityTier;
  incompatible: boolean;
  inEnclosure: boolean;
  delta: CandidateDelta;
  breakdown: {
    habitatCosine: number;
    sharedKeyCoverage: number;
    envelopeTightness: number;
    dietCompatibility: number;
    cohabitation: number;
    sizeHarmony: number;
  };
};

export const SIZE_WEIGHT: Record<SizeClass, number> = {
  Small: 1,
  Medium: 2,
  Large: 4,
};

export type SortMode = "compatibility" | "recommended" | "name" | "appeal";
