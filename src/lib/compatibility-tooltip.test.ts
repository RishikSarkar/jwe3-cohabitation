import { describe, expect, it } from "vitest";
import { compatibilityBreakdownLines } from "./compatibility-tooltip";

describe("compatibilityBreakdownLines", () => {
  const sample = {
    habitatCosine: 58,
    sharedKeyCoverage: 100,
    envelopeTightness: 24,
    dietCompatibility: 100,
    cohabitation: 100,
    spaceHeadroom: 100,
  };

  it("returns land factors sorted by weight descending", () => {
    const lines = compatibilityBreakdownLines(sample, "Land");
    expect(lines.map((l) => l.label)).toEqual([
      "Habitat match",
      "Feeders",
      "Envelope fit",
      "Social",
      "Key overlap",
      "Space",
    ]);
    expect(lines[0]).toMatchObject({
      label: "Habitat match",
      value: 58,
      weight: 0.35,
      weightLabel: "35%",
    });
    expect(lines).toHaveLength(6);
  });

  it("returns lagoon social and space sorted by weight", () => {
    const lines = compatibilityBreakdownLines(sample, "Lagoon");
    expect(lines).toEqual([
      {
        label: "Social",
        value: 100,
        weight: 0.6,
        weightLabel: "60%",
      },
      {
        label: "Space",
        value: 100,
        weight: 0.15,
        weightLabel: "15%",
      },
    ]);
  });
});
