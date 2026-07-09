/** Deterministic scoring weights — must sum to 1 per enclosure type. */
export const SCORE_WEIGHTS = {
  Land: {
    habitatCosine: 0.35,
    sharedKeyCoverage: 0.1,
    envelopeTightness: 0.15,
    diet: 0.2,
    cohabitation: 0.2,
  },
  Aviary: {
    habitatCosine: 0.35,
    sharedKeyCoverage: 0.1,
    envelopeTightness: 0.15,
    diet: 0.2,
    cohabitation: 0.2,
  },
  Lagoon: {
    habitatCosine: 0,
    sharedKeyCoverage: 0,
    envelopeTightness: 0,
    diet: 0,
    cohabitation: 0.75,
    sizeHarmony: 0.25,
  },
} as const;

/** Per-direction modest cohabitation discomfort (JWE3 neutral overlap). Stacks both ways. */
export const COHAB_SCORE = {
  neutralDiscomfort: 12,
} as const;

/** Non-linear population comfort — symmetric falloff outside the social band. */
export const POPULATION_SCORE = {
  overExponent: 6,
  underExponent: 6,
  /** Mild Lonely / Overcrowded still scores in Poor, but not near zero. */
  outOfBandFloor: 12,
} as const;

/** Blend inter-species cohabitation with within-species population comfort. */
export const SOCIAL_BLEND = {
  pairwise: 0.55,
  population: 0.45,
} as const;

export const NEW_TERRAIN_KEY_PENALTY = 12;

/** Scales envelope widen delta into a 0–100 tightness score. */
export const ENVELOPE_WIDEN_SCALE = 2;

/** Recommended sort: compatibility-first blend with normalized base appeal (sums to 1). */
export const RECOMMENDED_SORT_WEIGHTS = {
  compatibility: 0.8,
  appeal: 0.2,
} as const;
