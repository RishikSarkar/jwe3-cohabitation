import { describe, expect, it } from "vitest";
import { enclosureRatingBreakdownLines } from "@/lib/enclosure-rating-tooltip";

describe("enclosureRatingBreakdownLines", () => {
  it("shows population and logistics for a single-species enclosure", () => {
    const lines = enclosureRatingBreakdownLines(
      {
        social: 100,
        population: 82,
        logistics: 91,
        hasActiveDislike: false,
        worstMemberName: "Acrocanthosaurus",
      },
      1,
    );
    expect(lines.map((line) => line.label)).toEqual(["Population", "Logistics"]);
  });

  it("includes cohabitation for mixed enclosures", () => {
    const lines = enclosureRatingBreakdownLines(
      {
        social: 74,
        population: 88,
        logistics: 91,
        hasActiveDislike: false,
        worstMemberName: "Acrocanthosaurus",
      },
      2,
    );
    expect(lines.map((line) => line.label)).toEqual([
      "Cohabitation",
      "Population",
      "Logistics",
    ]);
  });
});
