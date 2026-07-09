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
} from "@/constants/scoring";
import { isBlockedPair, resolveCohabitation } from "./compatibility";
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

function tierFromScore(
  score: number | null,
  blocked: boolean,
  inEnclosure: boolean,
): CompatibilityTier {
  if (inEnclosure) return "Excellent";
  if (blocked || score === null || score <= 0) return "Blocked";
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
      notes.push(`${member.name} ↔ ${candidate.name}: incompatible`);
      continue;
    }
    const mr = resolveCohabitation(member, candidate);
    const cr = resolveCohabitation(candidate, member);
    if (mr === "liked") {
      notes.push(`${member.name} likes ${candidate.name} ✓`);
      total += COHAB_SCORE.memberLikesCandidate;
    } else if (cr === "liked") {
      notes.push(`${candidate.name} likes ${member.name} ✓`);
      total += COHAB_SCORE.candidateLikesMember;
    } else {
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
        newFeedingTypes: [],
        socialNotes: [],
        space: "—",
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
  let blocked = cohab.blocked;

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

  if (diet <= 0 && !isLagoon) blocked = true;

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
  const newFeeding = profile.feedingTypes.has(candidate.feedingType)
    ? []
    : [candidate.feedingType];

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
      diet:
        newFeeding.length === 0
          ? "Same feeders"
          : `+ ${newFeeding.join(", ")} needed`,
      newFeedingTypes: newFeeding,
      socialNotes: cohab.notes,
      space: spaceLabel,
      appealNote: candidate.appealPerHectare
        ? `${candidate.appealPerHectare} appeal/hectare`
        : undefined,
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
        terrain: "—",
        newTerrainKeys: [],
        diet: "—",
        newFeedingTypes: [],
        socialNotes: [],
        space: "—",
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
    const q = searchQuery.trim().toLowerCase();
    rows = rows.filter((r) => r.dinosaur.name.toLowerCase().includes(q));
  }

  if (!showBlocked) {
    rows = rows.filter((r) => r.inEnclosure || !r.blocked);
  }

  return rows;
}

export function sortScoredRows(
  rows: ScoredCandidate[],
  mode: SortMode,
  hasEnclosure: boolean,
): ScoredCandidate[] {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (mode) {
      case "name":
        return a.dinosaur.name.localeCompare(b.dinosaur.name);
      case "compatibility":
      default:
        if (!hasEnclosure) {
          return a.dinosaur.name.localeCompare(b.dinosaur.name);
        }
        return (b.score ?? 0) - (a.score ?? 0);
    }
  });

  return sorted;
}

/** @deprecated Use scoreAllDinosaurs */
export function scoreCandidates(
  state: EnclosureState,
  allDinos: Dinosaur[],
  showBlocked = false,
): ScoredCandidate[] {
  return scoreAllDinosaurs(state, allDinos, { showBlocked }).filter(
    (r) => !r.inEnclosure,
  );
}
