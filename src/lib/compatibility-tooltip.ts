import { SCORE_WEIGHTS } from "@/constants/scoring";
import type { EnclosureType } from "@/types/dinosaur";

export type CompatibilityBreakdown = {
  habitatCosine: number;
  sharedKeyCoverage: number;
  envelopeTightness: number;
  dietCompatibility: number;
  cohabitation: number;
  sizeHarmony: number;
};

export type BreakdownLine = {
  label: string;
  value: number;
  weightLabel: string;
  weight: number;
};

function pct(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

function sortByWeight(lines: BreakdownLine[]): BreakdownLine[] {
  return [...lines].sort((a, b) => b.weight - a.weight);
}

export function compatibilityBreakdownLines(
  breakdown: CompatibilityBreakdown,
  enclosureType: EnclosureType,
): BreakdownLine[] {
  const weights = SCORE_WEIGHTS[enclosureType];

  if (enclosureType === "Lagoon") {
    const lagoonWeights = SCORE_WEIGHTS.Lagoon;
    return sortByWeight([
      {
        label: "Social",
        value: breakdown.cohabitation,
        weight: lagoonWeights.cohabitation,
        weightLabel: pct(lagoonWeights.cohabitation),
      },
      {
        label: "Size match",
        value: breakdown.sizeHarmony,
        weight: lagoonWeights.sizeHarmony,
        weightLabel: pct(lagoonWeights.sizeHarmony),
      },
    ]);
  }

  return sortByWeight([
    {
      label: "Habitat match",
      value: breakdown.habitatCosine,
      weight: weights.habitatCosine,
      weightLabel: pct(weights.habitatCosine),
    },
    {
      label: "Feeders",
      value: breakdown.dietCompatibility,
      weight: weights.diet,
      weightLabel: pct(weights.diet),
    },
    {
      label: "Envelope fit",
      value: breakdown.envelopeTightness,
      weight: weights.envelopeTightness,
      weightLabel: pct(weights.envelopeTightness),
    },
    {
      label: "Social",
      value: breakdown.cohabitation,
      weight: weights.cohabitation,
      weightLabel: pct(weights.cohabitation),
    },
    {
      label: "Key overlap",
      value: breakdown.sharedKeyCoverage,
      weight: weights.sharedKeyCoverage,
      weightLabel: pct(weights.sharedKeyCoverage),
    },
  ]);
}
