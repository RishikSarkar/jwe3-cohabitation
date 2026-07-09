import { POPULATION_SCORE } from "@/constants/scoring";
import type { Dinosaur, DinosaurSocial, EnclosureMember } from "@/types/dinosaur";

export type ParsedSexRange = {
  min: number;
  max: number | null;
};

/** Parse in-game sex count strings (`0 - 2`, `1+`, `ANY`, `N/A`). */
export function parseSexRange(raw?: string): ParsedSexRange | null {
  if (!raw || raw === "ANY" || raw === "N/A") return null;

  const range = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };

  const plus = raw.match(/^(\d+)\+$/);
  if (plus) return { min: Number(plus[1]), max: null };

  const single = raw.match(/^(\d+)$/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };

  return null;
}

function hasPositiveTrait(dinosaur: Dinosaur, name: string): boolean {
  return (dinosaur.traits ?? []).some(
    (trait) => trait.name === name && trait.polarity === "positive",
  );
}

function hasNegativeTrait(dinosaur: Dinosaur, name: string): boolean {
  return (dinosaur.traits ?? []).some(
    (trait) => trait.name === name && trait.polarity === "negative",
  );
}

/** Derive optimizer population limits from in-game social needs. */
export function deriveSocialLimits(dinosaur: Dinosaur): DinosaurSocial {
  const needs = dinosaur.needs;
  const minPop = needs?.adultPopulation?.min ?? 1;
  const maleRange = parseSexRange(needs?.adultMales);
  const femaleRange = parseSexRange(needs?.adultFemales);

  let maxPop: number;
  if (maleRange?.max != null && femaleRange?.max != null) {
    maxPop = maleRange.max + femaleRange.max;
  } else {
    const batchMax = dinosaur.general?.batchSize?.max;
    if (hasNegativeTrait(dinosaur, "Antisocial")) {
      maxPop = minPop;
    } else if (hasPositiveTrait(dinosaur, "Social") && batchMax != null) {
      maxPop = minPop + batchMax;
    } else if (batchMax != null) {
      maxPop = Math.max(minPop, batchMax);
    } else {
      maxPop = minPop + 2;
    }
  }

  return {
    minPop,
    maxPop,
    ...(maleRange ? { minM: maleRange.min, maxM: maleRange.max ?? undefined } : {}),
    ...(femaleRange
      ? { minF: femaleRange.min, maxF: femaleRange.max ?? undefined }
      : {}),
  };
}

export function getSocialLimits(dinosaur: Dinosaur): DinosaurSocial {
  return dinosaur.social ?? deriveSocialLimits(dinosaur);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Score when count is outside the comfortable min–max band (Lonely / Overcrowded). */
function outsideBandScore(
  shortfall: number,
  bandEdge: number,
  exponent: number,
): number {
  if (shortfall <= 0 || bandEdge <= 0) return 100;

  const relative = Math.min(shortfall / bandEdge, 1);
  const curved = 100 * (1 - relative) ** exponent;
  return clampScore(Math.max(POPULATION_SCORE.outOfBandFloor, curved));
}

/**
 * Comfort within a min–max band. Inside the band = 100.
 * Outside the band, score falls off sharply and symmetrically (Lonely / Overcrowded).
 */
export function bandComfortScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return 100;
  if (value <= 0) return 0;

  if (value < min) {
    return outsideBandScore(min - value, min, POPULATION_SCORE.underExponent);
  }

  return outsideBandScore(value - max, max, POPULATION_SCORE.overExponent);
}

type PopulationIssue = {
  kind: "under" | "over" | "sex";
  text: string;
};

function populationIssues(
  limits: DinosaurSocial,
  males: number,
  females: number,
): PopulationIssue[] {
  const count = males + females;
  const minPop = limits.minPop ?? 1;
  const maxPop = limits.maxPop ?? count;
  const issues: PopulationIssue[] = [];

  if (count < minPop) {
    issues.push({
      kind: "under",
      text: `${count} adults (need ${minPop}+)`,
    });
  } else if (count > maxPop) {
    issues.push({
      kind: "over",
      text: `${count} adults (max ${maxPop})`,
    });
  }

  if (limits.maxM != null && males > limits.maxM) {
    issues.push({ kind: "sex", text: `${males} males (max ${limits.maxM})` });
  } else if (limits.minM != null && males < limits.minM) {
    issues.push({ kind: "sex", text: `${males} males (min ${limits.minM})` });
  }

  if (limits.maxF != null && females > limits.maxF) {
    issues.push({ kind: "sex", text: `${females} females (max ${limits.maxF})` });
  } else if (limits.minF != null && females < limits.minF) {
    issues.push({ kind: "sex", text: `${females} females (min ${limits.minF})` });
  }

  return issues;
}

function isLonelyIssue(issue: PopulationIssue): boolean {
  if (issue.kind === "under") return true;
  return issue.kind === "sex" && issue.text.includes("(min ");
}

/** One consolidated population note for row UI (JWE3 terms: Lonely / Overcrowded). */
export function formatPopulationNote(
  limits: DinosaurSocial,
  males: number,
  females: number,
): string | null {
  const issues = populationIssues(limits, males, females);
  if (issues.length === 0) return null;

  const headline = issues.some(isLonelyIssue) ? "Lonely" : "Overcrowded";

  return `${headline}: ${issues.map((issue) => issue.text).join(", ")}`;
}

export type PopulationComfort = {
  score: number;
  notes: string[];
};

/** Comfort for one stocked species row from adult counts vs social needs. */
export function speciesPopulationComfort(
  dinosaur: Dinosaur,
  males: number,
  females: number,
): PopulationComfort {
  const limits = getSocialLimits(dinosaur);
  const count = males + females;

  if (count === 0) {
    return { score: 100, notes: [] };
  }

  const minPop = limits.minPop ?? 1;
  const maxPop = limits.maxPop ?? count;
  const totalScore = bandComfortScore(count, minPop, maxPop);

  const maleScore =
    limits.maxM != null || limits.minM != null
      ? bandComfortScore(males, limits.minM ?? 0, limits.maxM ?? males)
      : 100;

  const femaleScore =
    limits.maxF != null || limits.minF != null
      ? bandComfortScore(females, limits.minF ?? 0, limits.maxF ?? females)
      : 100;

  const score = Math.min(totalScore, maleScore, femaleScore);
  const note = formatPopulationNote(limits, males, females);

  return {
    score,
    notes: note ? [note] : [],
  };
}

type PopulationEntry = {
  dinosaur: Dinosaur;
  males: number;
  females: number;
  count: number;
};

/** Headcount-weighted population comfort across stocked species (limited by worst species). */
export function enclosurePopulationScore(
  entries: PopulationEntry[],
): PopulationComfort {
  if (entries.length === 0) {
    return { score: 100, notes: [] };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let worstScore = 100;
  const notes: string[] = [];

  for (const entry of entries) {
    const comfort = speciesPopulationComfort(
      entry.dinosaur,
      entry.males,
      entry.females,
    );
    weightedSum += comfort.score * entry.count;
    totalWeight += entry.count;
    worstScore = Math.min(worstScore, comfort.score);
    notes.push(...comfort.notes);
  }

  const average =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;

  return {
    score: Math.min(average, worstScore),
    notes,
  };
}

export function memberPopulationComfort(
  dinosaur: Dinosaur,
  member: EnclosureMember | undefined,
  addMales = 0,
  addFemales = 0,
): PopulationComfort {
  const males = (member?.males ?? 0) + addMales;
  const females = (member?.females ?? 0) + addFemales;
  return speciesPopulationComfort(dinosaur, males, females);
}
