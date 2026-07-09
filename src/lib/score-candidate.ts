import {
  type CompatibilityTier,
  type Dinosaur,
  type EnclosureState,
  type EnclosureType,
  type ScoredCandidate,
  type SortMode,
} from "@/types/dinosaur";
import { HABITAT_LABELS } from "@/constants/canonical";
import {
  ENVELOPE_WIDEN_SCALE,
  NEW_TERRAIN_KEY_PENALTY,
  SCORE_WEIGHTS,
  RECOMMENDED_SORT_WEIGHTS,
  SOCIAL_BLEND,
} from "@/constants/scoring";
import {
  describeCohabIncompatibility,
  isIncompatiblePair,
  pairCohabitationScore,
  resolveCohabitation,
} from "./compatibility";
import { candidateFootprintNote } from "./area-need";
import {
  buildEnclosureProfile,
  dietCompatibilityScore,
  envelopeWidenDelta,
  type HabitatEnvelope,
} from "./enclosure";
import {
  cosineSimilarity,
  habitatToVector,
  sharedKeyCoverage,
} from "./vectors";
import { buildFeederDelta } from "./feeder-delta";
import { memberPopulationComfort } from "./population";
import { matchesDinoSearch } from "./search";

function tierFromScore(
  score: number | null,
  incompatible: boolean,
  inEnclosure: boolean,
): CompatibilityTier {
  if (inEnclosure) return "Excellent";
  if (incompatible || score === null) return "Incompatible";
  if (score <= 0) return "Poor";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Risky";
  return "Poor";
}

function envelopeTightnessScore(
  envelope: HabitatEnvelope,
  candidate: Dinosaur,
): number {
  const { delta, newKeys } = envelopeWidenDelta(envelope, candidate);
  const penalty = delta + newKeys.length * NEW_TERRAIN_KEY_PENALTY;
  return Math.max(0, 100 - penalty * ENVELOPE_WIDEN_SCALE);
}

function cohabitationAggregate(
  members: Dinosaur[],
  candidate: Dinosaur,
  state: EnclosureState,
): { score: number; notes: string[]; incompatible: boolean } {
  const notes: string[] = [];
  let incompatible = false;
  let scoreSum = 0;

  for (const member of members) {
    if (isIncompatiblePair(member, candidate)) {
      incompatible = true;
      notes.push(describeCohabIncompatibility(member, candidate));
      continue;
    }

    const pair = pairCohabitationScore(member, candidate);
    scoreSum += pair.score;

    const mr = resolveCohabitation(member, candidate);
    const cr = resolveCohabitation(candidate, member);
    if (mr === "liked") {
      notes.push(`${member.name} likes ${candidate.name}`);
    }
    if (cr === "liked") {
      notes.push(`${candidate.name} likes ${member.name}`);
    }
    if (pair.score < 100) {
      notes.push(`Cohabitation discomfort with ${member.name}`);
    }
  }

  const pairwiseScore =
    members.length > 0 ? Math.round(scoreSum / members.length) : 100;

  const existingMember = state.members.find(
    (member) => member.dinosaurId === candidate.id,
  );
  const population = memberPopulationComfort(candidate, existingMember, 0, 1);
  notes.push(...population.notes);

  const score =
    members.length > 0
      ? Math.round(
          pairwiseScore * SOCIAL_BLEND.pairwise +
            population.score * SOCIAL_BLEND.population,
        )
      : population.score;

  return { score, notes, incompatible };
}

function scoreOne(
  candidate: Dinosaur,
  state: EnclosureState,
  profile: NonNullable<ReturnType<typeof buildEnclosureProfile>>,
  inEnclosure: boolean,
): ScoredCandidate {
  if (inEnclosure) {
    return {
      dinosaur: candidate,
      score: null,
      tier: "Excellent",
      incompatible: false,
      inEnclosure: true,
      delta: {
        terrain: "Already in enclosure",
        newTerrainKeys: [],
        feederNotes: [],
        newFeedingTypes: [],
        socialNotes: [],
        space: "-",
      },
      breakdown: {
        habitatCosine: 100,
        sharedKeyCoverage: 100,
        envelopeTightness: 100,
        dietCompatibility: 100,
        cohabitation: 100,
        sizeHarmony: 100,
      },
    };
  }

  const weights = SCORE_WEIGHTS[state.type as EnclosureType];
  const isLagoon = state.type === "Lagoon";

  const cohab = cohabitationAggregate(profile.members, candidate, state);
  const incompatible = cohab.incompatible;

  const compromiseVec = habitatToVector(profile.envelope.compromise);
  const candidateVec = habitatToVector(candidate.habitat);
  const habitatCosine = isLagoon
    ? 0
    : Math.round(cosineSimilarity(compromiseVec, candidateVec) * 100);

  const keyCoverage = isLagoon
    ? 100
    : Math.round(
        sharedKeyCoverage(profile.envelope.activeKeys, candidate.habitat) *
          100,
      );

  const envelopeTight = isLagoon
    ? 100
    : Math.round(envelopeTightnessScore(profile.envelope, candidate));

  const diet = isLagoon
    ? 100
    : dietCompatibilityScore(
        profile.feedingTypes,
        candidate,
        profile.members,
      );

  let sizeHarmonyScore = 50;
  if (isLagoon && "sizeHarmony" in weights) {
    sizeHarmonyScore = profile.members.some((m) => m.size === candidate.size)
      ? 80
      : 60;
  }

  const w = weights as Record<string, number>;
  const composite =
    habitatCosine * (w.habitatCosine ?? 0) +
    keyCoverage * (w.sharedKeyCoverage ?? 0) +
    envelopeTight * (w.envelopeTightness ?? 0) +
    diet * (w.diet ?? 0) +
    cohab.score * (w.cohabitation ?? 0) +
    sizeHarmonyScore * (w.sizeHarmony ?? 0);

  const finalScore = incompatible ? 0 : Math.round(composite);

  const { newKeys } = envelopeWidenDelta(profile.envelope, candidate);
  const { notes: feederNotes, newFeedingTypes: newFeeding } = buildFeederDelta(
    candidate,
    profile,
    newKeys,
  );

  const spaceLabel = candidateFootprintNote(profile.spaceLoad, candidate);

  return {
    dinosaur: candidate,
    score: finalScore,
    tier: tierFromScore(finalScore, incompatible, false),
    incompatible,
    inEnclosure: false,
    delta: {
      terrain:
        newKeys.length === 0
          ? "No new terrain types needed"
          : `+ ${newKeys.map((k) => HABITAT_LABELS[k]).join(", ")} required`,
      newTerrainKeys: newKeys,
      feederNotes,
      newFeedingTypes: newFeeding,
      socialNotes: cohab.notes,
      space: spaceLabel,
    },
    breakdown: {
      habitatCosine,
      sharedKeyCoverage: keyCoverage,
      envelopeTightness: envelopeTight,
      dietCompatibility: Math.round(diet),
      cohabitation: Math.round(cohab.score),
      sizeHarmony: Math.round(sizeHarmonyScore),
    },
  };
}

export function scoreAllDinosaurs(
  state: EnclosureState,
  allDinos: Dinosaur[],
  options: { showIncompatible?: boolean; searchQuery?: string } = {},
): ScoredCandidate[] {
  const { showIncompatible = false, searchQuery = "" } = options;
  const memberIds = new Set(
    state.members
      .filter((m) => m.males + m.females > 0)
      .map((m) => m.dinosaurId),
  );

  const typeDinos = allDinos.filter((d) => d.enclosureType === state.type);
  const profile = buildEnclosureProfile(state, allDinos);

  let rows: ScoredCandidate[];

  if (!profile) {
    rows = typeDinos.map((d) => ({
      dinosaur: d,
      score: null,
      tier: "Excellent" as CompatibilityTier,
      incompatible: false,
      inEnclosure: false,
      delta: {
        terrain: "-",
        newTerrainKeys: [],
        feederNotes: [],
        newFeedingTypes: [],
        socialNotes: [],
        space: "-",
      },
      breakdown: {
        habitatCosine: 0,
        sharedKeyCoverage: 0,
        envelopeTightness: 0,
        dietCompatibility: 0,
        cohabitation: 0,
        sizeHarmony: 0,
      },
    }));
  } else {
    rows = typeDinos.map((d) =>
      scoreOne(d, state, profile, memberIds.has(d.id)),
    );
  }

  if (searchQuery.trim()) {
    rows = rows.filter((r) => matchesDinoSearch(searchQuery, r.dinosaur));
  }

  if (!showIncompatible) {
    rows = rows.filter((r) => r.inEnclosure || !r.incompatible);
  }

  return rows;
}

/** How well a stocked species fits the rest of the enclosure (candidate-list logic). */
export function scoreMemberAgainstRest(
  member: Dinosaur,
  state: EnclosureState,
  allDinos: Dinosaur[],
): { score: number; incompatible: boolean; tier: CompatibilityTier } {
  const restState: EnclosureState = {
    ...state,
    members: state.members.filter((m) => m.dinosaurId !== member.id),
  };
  const profile = buildEnclosureProfile(restState, allDinos);
  if (!profile) {
    return { score: 100, incompatible: false, tier: "Excellent" };
  }

  const row = scoreOne(member, restState, profile, false);
  return {
    score: row.score ?? 0,
    incompatible: row.incompatible,
    tier: row.tier,
  };
}

function appealRange(rows: ScoredCandidate[]): { min: number; max: number } {
  const values = rows.map((r) => r.dinosaur.appeal ?? 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function normalizedAppealScore(
  appeal: number | undefined,
  min: number,
  max: number,
): number {
  const value = appeal ?? 0;
  if (max <= min) return value > 0 ? 100 : 0;
  return ((value - min) / (max - min)) * 100;
}

/** Blends candidate compatibility with appeal normalized across the current list. */
export function recommendedCandidateScore(
  row: ScoredCandidate,
  appealMin: number,
  appealMax: number,
): number {
  if (row.incompatible) return 0;
  const compatibility = row.score ?? 0;
  const appeal = normalizedAppealScore(
    row.dinosaur.appeal,
    appealMin,
    appealMax,
  );
  return (
    compatibility * RECOMMENDED_SORT_WEIGHTS.compatibility +
    appeal * RECOMMENDED_SORT_WEIGHTS.appeal
  );
}

export function sortScoredRows(
  rows: ScoredCandidate[],
  mode: SortMode,
  hasEnclosure: boolean,
): ScoredCandidate[] {
  const sorted = [...rows];
  const { min: appealMin, max: appealMax } = appealRange(sorted);

  sorted.sort((a, b) => {
    switch (mode) {
      case "name":
        return a.dinosaur.name.localeCompare(b.dinosaur.name);
      case "appeal": {
        const appealDiff =
          (b.dinosaur.appeal ?? 0) - (a.dinosaur.appeal ?? 0);
        if (appealDiff !== 0) return appealDiff;
        return a.dinosaur.name.localeCompare(b.dinosaur.name);
      }
      case "recommended":
        if (!hasEnclosure) {
          const appealDiff =
            (b.dinosaur.appeal ?? 0) - (a.dinosaur.appeal ?? 0);
          if (appealDiff !== 0) return appealDiff;
          return a.dinosaur.name.localeCompare(b.dinosaur.name);
        }
        {
          const recommendedDiff =
            recommendedCandidateScore(b, appealMin, appealMax) -
            recommendedCandidateScore(a, appealMin, appealMax);
          if (recommendedDiff !== 0) return recommendedDiff;
          return a.dinosaur.name.localeCompare(b.dinosaur.name);
        }
      case "compatibility":
      default:
        if (!hasEnclosure) {
          return a.dinosaur.name.localeCompare(b.dinosaur.name);
        }
        {
          const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
          if (scoreDiff !== 0) return scoreDiff;
          return a.dinosaur.name.localeCompare(b.dinosaur.name);
        }
    }
  });

  return sorted;
}
