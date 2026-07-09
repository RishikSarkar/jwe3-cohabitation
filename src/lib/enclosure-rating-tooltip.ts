import { SOCIAL_BLEND } from "@/constants/scoring";
import type { EnclosureRating } from "@/lib/enclosure-rating";
import type { BreakdownLine } from "@/lib/compatibility-tooltip";

const SOCIAL_WEIGHT = 0.85;
const LOGISTICS_WEIGHT = 0.15;

function pct(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

function sortByWeight(lines: BreakdownLine[]): BreakdownLine[] {
  return [...lines].sort((a, b) => b.weight - a.weight);
}

export function enclosureRatingBreakdownLines(
  breakdown: EnclosureRating["breakdown"],
  speciesCount: number,
): BreakdownLine[] {
  if (speciesCount < 2) {
    return sortByWeight([
      {
        label: "Population",
        value: breakdown.population,
        weight: SOCIAL_WEIGHT,
        weightLabel: pct(SOCIAL_WEIGHT),
      },
      {
        label: "Logistics",
        value: breakdown.logistics,
        weight: LOGISTICS_WEIGHT,
        weightLabel: pct(LOGISTICS_WEIGHT),
      },
    ]);
  }

  const cohabWeight = SOCIAL_WEIGHT * SOCIAL_BLEND.pairwise;
  const populationWeight = SOCIAL_WEIGHT * SOCIAL_BLEND.population;

  return sortByWeight([
    {
      label: "Cohabitation",
      value: breakdown.social,
      weight: cohabWeight,
      weightLabel: pct(cohabWeight),
    },
    {
      label: "Population",
      value: breakdown.population,
      weight: populationWeight,
      weightLabel: pct(populationWeight),
    },
    {
      label: "Logistics",
      value: breakdown.logistics,
      weight: LOGISTICS_WEIGHT,
      weightLabel: pct(LOGISTICS_WEIGHT),
    },
  ]);
}
