import {
  type CompatibilityTier,
  type Dinosaur,
  type EnclosureState,
} from "@/types/dinosaur";
import { SOCIAL_BLEND } from "@/constants/scoring";
import { enclosureAreaNeedStat } from "./area-need";
import {
  pairCohabitationScore,
} from "./compatibility";
import { enclosurePopulationScore } from "./population";
import { scoreMemberAgainstRest } from "./score-candidate";

const SOCIAL_WEIGHT = 0.85;
const LOGISTICS_WEIGHT = 0.15;

export type EnclosureRating = {
  score: number;
  tier: CompatibilityTier;
  headcount: number;
  speciesCount: number;
  baseAppeal: number;
  areaNeed: { value: string; label: string } | null;
  incompatible: boolean;
  breakdown: {
    social: number;
    population: number;
    logistics: number;
    hasActiveDislike: boolean;
    worstMemberName: string;
  };
};

type MemberEntry = {
  dinosaur: Dinosaur;
  count: number;
  males: number;
  females: number;
};

function tierFromScore(score: number, incompatible: boolean): CompatibilityTier {
  if (incompatible || score <= 0) return "Incompatible";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Risky";
  return "Poor";
}

function memberEntries(
  state: EnclosureState,
  allDinos: Dinosaur[],
): MemberEntry[] {
  const byId = new Map(allDinos.map((d) => [d.id, d]));
  const entries: MemberEntry[] = [];

  for (const member of state.members) {
    const dinosaur = byId.get(member.dinosaurId);
    const count = member.males + member.females;
    if (!dinosaur || dinosaur.enclosureType !== state.type || count <= 0) {
      continue;
    }
    entries.push({
      dinosaur,
      count,
      males: member.males,
      females: member.females,
    });
  }

  return entries;
}

function enclosureBaseAppeal(entries: MemberEntry[]): number {
  return entries.reduce(
    (sum, { dinosaur, count }) => sum + (dinosaur.appeal ?? 0) * count,
    0,
  );
}

function pairSocialScore(
  a: Dinosaur,
  b: Dinosaur,
): { score: number; disliked: boolean } {
  const pair = pairCohabitationScore(a, b);
  return { score: pair.score, disliked: pair.incompatible };
}

function enclosurePairwiseSocialScore(entries: MemberEntry[]): {
  score: number;
  hasActiveDislike: boolean;
} {
  if (entries.length < 2) {
    return { score: 100, hasActiveDislike: false };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let hasActiveDislike = false;

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const { dinosaur: a, count: countA } = entries[i];
      const { dinosaur: b, count: countB } = entries[j];
      const weight = countA * countB;
      const pair = pairSocialScore(a, b);

      if (pair.disliked) hasActiveDislike = true;
      weightedSum += pair.score * weight;
      totalWeight += weight;
    }
  }

  return {
    score: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100,
    hasActiveDislike,
  };
}

function enclosureLogisticsScore(
  entries: MemberEntry[],
  state: EnclosureState,
  allDinos: Dinosaur[],
): { score: number; worstMemberName: string } {
  let weightedSum = 0;
  let totalWeight = 0;
  let worstMemberFit = 100;
  let worstMemberName = entries[0].dinosaur.name;

  for (const { dinosaur, count } of entries) {
    const fit = scoreMemberAgainstRest(dinosaur, state, allDinos);
    weightedSum += fit.score * count;
    totalWeight += count;

    if (fit.score < worstMemberFit) {
      worstMemberFit = fit.score;
      worstMemberName = dinosaur.name;
    }
  }

  return {
    score: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100,
    worstMemberName,
  };
}

function blendSocialScore(
  pairwise: { score: number; hasActiveDislike: boolean },
  population: { score: number },
  speciesCount: number,
): number {
  if (speciesCount < 2) {
    return population.score;
  }

  return Math.round(
    pairwise.score * SOCIAL_BLEND.pairwise +
      population.score * SOCIAL_BLEND.population,
  );
}

/**
 * Enclosure rating prioritizes social compatibility (likes / neutral / dislikes)
 * and within-species population comfort. Active dislikes between stocked species
 * force an incompatible rating. Terrain and feeders apply as a small secondary adjustment.
 */
export function computeEnclosureRating(
  state: EnclosureState,
  allDinos: Dinosaur[],
): EnclosureRating | null {
  const entries = memberEntries(state, allDinos);
  if (entries.length === 0) return null;

  const headcount = entries.reduce((sum, e) => sum + e.count, 0);
  const baseAppeal = enclosureBaseAppeal(entries);
  const areaNeed = enclosureAreaNeedStat(entries);
  const pairwise = enclosurePairwiseSocialScore(entries);
  const population = enclosurePopulationScore(entries);
  const social = blendSocialScore(pairwise, population, entries.length);
  const logistics = enclosureLogisticsScore(entries, state, allDinos);

  if (pairwise.hasActiveDislike) {
    return {
      score: 0,
      tier: "Incompatible",
      headcount,
      speciesCount: entries.length,
      baseAppeal,
      areaNeed,
      incompatible: true,
      breakdown: {
        social: pairwise.score,
        population: population.score,
        logistics: logistics.score,
        hasActiveDislike: true,
        worstMemberName: logistics.worstMemberName,
      },
    };
  }

  const score = Math.round(
    entries.length < 2
      ? population.score
      : Math.min(
          social * SOCIAL_WEIGHT + logistics.score * LOGISTICS_WEIGHT,
          population.score,
        ),
  );

  return {
    score,
    tier: tierFromScore(score, false),
    headcount,
    speciesCount: entries.length,
    baseAppeal,
    areaNeed,
    incompatible: false,
    breakdown: {
      social: pairwise.score,
      population: population.score,
      logistics: logistics.score,
      hasActiveDislike: false,
      worstMemberName: logistics.worstMemberName,
    },
  };
}
