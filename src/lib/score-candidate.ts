import {
  ENCLOSURE_CAPACITY,
  SIZE_WEIGHT,
  type CompatibilityTier,
  type Dinosaur,
  type EnclosureState,
  type EnclosureType,
  type ScoredCandidate,
  type SortMode,
} from "@/types/dinosaur";
import { HABITAT_LABELS } from "@/constants/canonical";
import {
  COHAB_SCORE,
  NEW_TERRAIN_KEY_PENALTY,
  SCORE_WEIGHTS,
  RECOMMENDED_SORT_WEIGHTS,
} from "@/constants/scoring";
import { isBlockedPair, resolveCohabitation, describeCohabBlock } from "./compatibility";
import {
  buildEnclosureProfile,
  dietCompatibilityScore,
  envelopeWidenDelta,
  spaceHeadroomScore,
  type HabitatEnvelope,
} from "./enclosure";
import {
  cosineSimilarity,
  habitatToVector,
  sharedKeyCoverage,
} from "./vectors";
import { buildFeederDelta, summarizeFeederDelta } from "./feeder-delta";
import { matchesDinoSearch } from "./search";

function tierFromScore(
  score: number | null,
  blocked: boolean,
  inEnclosure: boolean,
): CompatibilityTier {
  if (inEnclosure) return "Excellent";
  if (blocked || score === null) return "Blocked";
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
  return Math.max(0, 100 - penalty * 2);
}

function cohabitationAggregate(
  members: Dinosaur[],
  candidate: Dinosaur,
): { score: number; notes: string[]; blocked: boolean } {
  let total = COHAB_SCORE.baseline;
  const notes: string[] = [];
  let blocked = false;

  for (const member of members) {
    if (isBlockedPair(member, candidate)) {
      blocked = true;
      notes.push(describeCohabBlock(member, candidate));
      continue;
    }
    const mr = resolveCohabitation(member, candidate);
    const cr = resolveCohabitation(candidate, member);
    if (mr === "liked") {
      notes.push(`${member.name} likes ${candidate.name}`);
      total += COHAB_SCORE.memberLikesCandidate;
    }
    if (cr === "liked") {
      notes.push(`${candidate.name} likes ${member.name}`);
      total += COHAB_SCORE.candidateLikesMember;
    }
    if (mr !== "liked" && cr !== "liked") {
      notes.push(`Neutral with ${member.name} (−comfort)`);
      total -= COHAB_SCORE.neutralPenalty;
    }
  }

  const norm =
    members.length > 0
      ? Math.max(0, Math.min(100, total / members.length))
      : COHAB_SCORE.baseline;

  return { score: norm, notes, blocked };
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
      blocked: false,
      inEnclosure: true,
      delta: {
        terrain: "Already in enclosure",
        newTerrainKeys: [],
        diet: "Current feeder set",
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
        spaceHeadroom: 100,
      },
    };
  }

  const weights = SCORE_WEIGHTS[state.type as EnclosureType];
  const isLagoon = state.type === "Lagoon";

  const cohab = cohabitationAggregate(profile.members, candidate);
  const blocked = cohab.blocked;

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

  const space = spaceHeadroomScore(profile, candidate, state);

  let sizeHarmony = 50;
  if (isLagoon && "sizeHarmony" in weights) {
    sizeHarmony = profile.members.some((m) => m.size === candidate.size)
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
    space * (w.space ?? 0) +
    sizeHarmony * (w.sizeHarmony ?? 0);

  const finalScore = blocked ? 0 : Math.round(composite);

  const { newKeys } = envelopeWidenDelta(profile.envelope, candidate);
  const { notes: feederNotes, newFeedingTypes: newFeeding } = buildFeederDelta(
    candidate,
    profile,
    newKeys,
  );

  let spaceLabel = `Fits ${state.size} enclosure`;
  const growth = 1 + (candidate.spaceGrowthPercent ?? 25) / 100;
  const addedLoad = SIZE_WEIGHT[candidate.size] * growth;
  const newPressure =
    (profile.spaceLoad + addedLoad) / ENCLOSURE_CAPACITY[state.size];
  if (newPressure > 1) spaceLabel = "May need larger enclosure";
  else if (newPressure > 0.85) spaceLabel = `Tight fit for ${state.size}`;

  return {
    dinosaur: candidate,
    score: finalScore,
    tier: tierFromScore(finalScore, blocked, false),
    blocked,
    inEnclosure: false,
    delta: {
      terrain:
        newKeys.length === 0
          ? "No new terrain types needed"
          : `+ ${newKeys.map((k) => HABITAT_LABELS[k]).join(", ")} required`,
      newTerrainKeys: newKeys,
      diet: summarizeFeederDelta(feederNotes),
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
      spaceHeadroom: Math.round(space),
    },
  };
}

export function scoreAllDinosaurs(
  state: EnclosureState,
  allDinos: Dinosaur[],
  options: { showBlocked?: boolean; searchQuery?: string } = {},
): ScoredCandidate[] {
  const { showBlocked = false, searchQuery = "" } = options;
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
      blocked: false,
      inEnclosure: false,
      delta: {
        terrain: "-",
        newTerrainKeys: [],
        diet: "-",
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
        spaceHeadroom: 0,
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

  if (!showBlocked) {
    rows = rows.filter((r) => r.inEnclosure || !r.blocked);
  }

  return rows;
}

/** How well a stocked species fits the rest of the enclosure (candidate-list logic). */
export function scoreMemberAgainstRest(
  member: Dinosaur,
  state: EnclosureState,
  allDinos: Dinosaur[],
): { score: number; blocked: boolean; tier: CompatibilityTier } {
  const restState: EnclosureState = {
    ...state,
    members: state.members.filter((m) => m.dinosaurId !== member.id),
  };
  const profile = buildEnclosureProfile(restState, allDinos);
  if (!profile) {
    return { score: 100, blocked: false, tier: "Excellent" };
  }

  const row = scoreOne(member, restState, profile, false);
  return {
    score: row.score ?? 0,
    blocked: row.blocked,
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
  if (row.blocked) return 0;
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

/** @deprecated Use scoreAllDinosaurs */
export function scoreCandidates(
  state: EnclosureState,
  allDinos: Dinosaur[],
): ScoredCandidate[] {
  return scoreAllDinosaurs(state, allDinos).filter((r) => !r.inEnclosure);
}
