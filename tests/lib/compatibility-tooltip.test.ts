import { describe, expect, it } from "vitest";
import { compatibilityBreakdownLines } from "@/lib/compatibility-tooltip";

describe("compatibilityBreakdownLines", () => {
  const sample = {
    habitatCosine: 58,
    sharedKeyCoverage: 100,
    envelopeTightness: 24,
    dietCompatibility: 100,
    cohabitation: 100,
    sizeHarmony: 70,
  };

  it("returns land factors sorted by weight descending", () => {
    const lines = compatibilityBreakdownLines(sample, "Land");
    expect(lines.map((l) => l.label)).toEqual([
      "Habitat match",
      "Feeders",
      "Social",
      "Envelope fit",
      "Key overlap",
    ]);
    expect(lines[0]).toMatchObject({
      label: "Habitat match",
      value: 58,
      weight: 0.35,
      weightLabel: "35%",
    });
    expect(lines).toHaveLength(5);
  });

  it("returns lagoon social and size match by weight", () => {
    const lines = compatibilityBreakdownLines(sample, "Lagoon");
    expect(lines).toEqual([
      {
        label: "Social",
        value: 100,
        weight: 0.75,
        weightLabel: "75%",
      },
      {
        label: "Size match",
        value: 70,
        weight: 0.25,
        weightLabel: "25%",
      },
    ]);
  });
});
