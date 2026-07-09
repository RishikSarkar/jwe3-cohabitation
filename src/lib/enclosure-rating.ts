import {
  type CompatibilityTier,
  type Dinosaur,
  type EnclosureState,
} from "@/types/dinosaur";
import { COHAB_SCORE } from "@/constants/scoring";
import { isBlockedPair, resolveCohabitation } from "./compatibility";
import { scoreMemberAgainstRest } from "./score-candidate";

const SOCIAL_WEIGHT = 0.85;
const LOGISTICS_WEIGHT = 0.15;

export type EnclosureRating = {
  score: number;
  tier: CompatibilityTier;
  headcount: number;
  speciesCount: number;
  baseAppeal: number;
  blocked: boolean;
  breakdown: {
    social: number;
    logistics: number;
    hasActiveDislike: boolean;
    worstMemberName: string;
  };
};

type MemberEntry = {
  dinosaur: Dinosaur;
  count: number;
};

function tierFromScore(score: number, blocked: boolean): CompatibilityTier {
  if (blocked || score <= 0) return "Blocked";
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
    entries.push({ dinosaur, count });
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
  if (isBlockedPair(a, b)) {
    return { score: 0, disliked: true };
  }

  const aToB = resolveCohabitation(a, b);
  const bToA = resolveCohabitation(b, a);

  let score = COHAB_SCORE.baseline;
  if (aToB === "liked") score += COHAB_SCORE.memberLikesCandidate;
  if (bToA === "liked") score += COHAB_SCORE.candidateLikesMember;
  if (aToB !== "liked" && bToA !== "liked") {
    score -= COHAB_SCORE.neutralPenalty;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    disliked: false,
  };
}

function enclosureSocialScore(entries: MemberEntry[]): {
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

/**
 * Enclosure rating prioritizes social compatibility (likes / neutral / dislikes).
 * Active dislikes between stocked species force a blocked rating.
 * Terrain, feeders, and space only apply as a small secondary adjustment.
 */
export function computeEnclosureRating(
  state: EnclosureState,
  allDinos: Dinosaur[],
): EnclosureRating | null {
  const entries = memberEntries(state, allDinos);
  if (entries.length === 0) return null;

  const headcount = entries.reduce((sum, e) => sum + e.count, 0);
  const baseAppeal = enclosureBaseAppeal(entries);
  const social = enclosureSocialScore(entries);
  const logistics = enclosureLogisticsScore(entries, state, allDinos);

  if (social.hasActiveDislike) {
    return {
      score: 0,
      tier: "Blocked",
      headcount,
      speciesCount: entries.length,
      baseAppeal,
      blocked: true,
      breakdown: {
        social: social.score,
        logistics: logistics.score,
        hasActiveDislike: true,
        worstMemberName: logistics.worstMemberName,
      },
    };
  }

  const score = Math.round(
    social.score * SOCIAL_WEIGHT + logistics.score * LOGISTICS_WEIGHT,
  );

  return {
    score,
    tier: tierFromScore(score, false),
    headcount,
    speciesCount: entries.length,
    baseAppeal,
    blocked: false,
    breakdown: {
      social: social.score,
      logistics: logistics.score,
      hasActiveDislike: false,
      worstMemberName: logistics.worstMemberName,
    },
  };
}
