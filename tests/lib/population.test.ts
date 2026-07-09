import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import {
  bandComfortScore,
  deriveSocialLimits,
  parseSexRange,
  speciesPopulationComfort,
} from "@/lib/population";

const all = allDinosaurs;

describe("parseSexRange", () => {
  it("parses bounded ranges", () => {
    expect(parseSexRange("0 - 2")).toEqual({ min: 0, max: 2 });
  });

  it("parses minimum-only values", () => {
    expect(parseSexRange("1+")).toEqual({ min: 1, max: null });
  });

  it("returns null for open-ended values", () => {
    expect(parseSexRange("ANY")).toBeNull();
    expect(parseSexRange("N/A")).toBeNull();
  });
});

describe("deriveSocialLimits", () => {
  it("uses explicit sex caps when both are bounded", () => {
    const acro = all.find((d) => d.id === "acrocanthosaurus")!;
    expect(deriveSocialLimits(acro)).toEqual({
      minPop: 1,
      maxPop: 4,
      minM: 0,
      maxM: 2,
      minF: 0,
      maxF: 2,
    });
  });

  it("uses antisocial trait to cap at minimum population", () => {
    const deino = all.find((d) => d.id === "deinocheirus")!;
    expect(deriveSocialLimits(deino).maxPop).toBe(2);
  });

  it("uses social trait and batch size for pack species", () => {
    const compy = all.find((d) => d.id === "compsognathus")!;
    expect(deriveSocialLimits(compy)).toEqual({
      minPop: 5,
      maxPop: 11,
    });
  });
});

describe("speciesPopulationComfort", () => {
  it("penalizes overcrowding sharply", () => {
    const acro = all.find((d) => d.id === "acrocanthosaurus")!;
    const mild = speciesPopulationComfort(acro, 3, 2);
    const severe = speciesPopulationComfort(acro, 9, 6);
    expect(mild.score).toBeGreaterThanOrEqual(12);
    expect(mild.score).toBeLessThan(40);
    expect(severe.score).toBeLessThanOrEqual(mild.score);
    expect(severe.notes).toEqual([
      "Overcrowded: 15 adults (max 4), 9 males (max 2), 6 females (max 2)",
    ]);
  });

  it("penalizes underpopulation", () => {
    const compy = all.find((d) => d.id === "compsognathus")!;
    const comfort = speciesPopulationComfort(compy, 0, 2);
    expect(comfort.score).toBeLessThan(40);
    expect(comfort.notes).toEqual(["Lonely: 2 adults (need 5+)"]);
  });

  it("rewards comfortable population counts", () => {
    const acro = all.find((d) => d.id === "acrocanthosaurus")!;
    const comfort = speciesPopulationComfort(acro, 2, 2);
    expect(comfort.score).toBe(100);
    expect(comfort.notes).toEqual([]);
  });
});

describe("bandComfortScore", () => {
  it("penalizes one adult over max in the Poor range, not near zero", () => {
    const oneOver = bandComfortScore(6, 4, 5);
    const extreme = bandComfortScore(15, 1, 4);
    expect(oneOver).toBeGreaterThanOrEqual(20);
    expect(oneOver).toBeLessThan(40);
    expect(extreme).toBeLessThanOrEqual(oneOver);
    expect(extreme).toBeGreaterThanOrEqual(12);
  });

  it("penalizes one adult under min the same way", () => {
    const oneUnder = bandComfortScore(3, 4, 5);
    expect(oneUnder).toBeGreaterThanOrEqual(15);
    expect(oneUnder).toBeLessThan(40);
  });
});
