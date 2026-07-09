/** Deterministic scoring weights — must sum to 1 per enclosure type. */
export const SCORE_WEIGHTS = {
  Land: {
    habitatCosine: 0.35,
    sharedKeyCoverage: 0.1,
    envelopeTightness: 0.15,
    diet: 0.2,
    cohabitation: 0.15,
    space: 0.05,
  },
  Aviary: {
    habitatCosine: 0.35,
    sharedKeyCoverage: 0.1,
    envelopeTightness: 0.15,
    diet: 0.2,
    cohabitation: 0.15,
    space: 0.05,
  },
  Lagoon: {
    habitatCosine: 0,
    sharedKeyCoverage: 0,
    envelopeTightness: 0,
    diet: 0,
    cohabitation: 0.6,
    space: 0.15,
    sizeHarmony: 0.25,
  },
} as const;

export const COHAB_SCORE = {
  memberLikesCandidate: 35,
  candidateLikesMember: 25,
  neutralPenalty: 8,
  baseline: 50,
} as const;

export const NEW_TERRAIN_KEY_PENALTY = 12;

export const ENVELOPE_WIDEN_SCALE = 2;

/** Recommended sort: compatibility-first blend with normalized base appeal (sums to 1). */
export const RECOMMENDED_SORT_WEIGHTS = {
  compatibility: 0.8,
  appeal: 0.2,
} as const;
