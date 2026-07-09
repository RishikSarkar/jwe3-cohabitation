import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import { computeEnclosureRating } from "@/lib/enclosure-rating";
import type { EnclosureState } from "@/types/dinosaur";

const all = allDinosaurs;

describe("computeEnclosureRating", () => {
  it("returns null for an empty enclosure", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [],
    };
    expect(computeEnclosureRating(state, all)).toBeNull();
  });

  it("keeps empty rating null so the banner can render placeholders", () => {
    expect(
      computeEnclosureRating(
        { type: "Aviary", members: [] },
        all,
      ),
    ).toBeNull();
  });

  it("rates a comfortable single-species enclosure as excellent", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [{ dinosaurId: "acrocanthosaurus", males: 2, females: 2 }],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.score).toBe(100);
    expect(rating?.tier).toBe("Excellent");
    expect(rating?.breakdown.population).toBe(100);
  });

  it("lowers rating when a species is overcrowded", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [{ dinosaurId: "acrocanthosaurus", males: 3, females: 3 }],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.breakdown.population).toBeLessThan(40);
    expect(rating?.score).toBeLessThan(40);
    expect(rating?.tier).toMatch(/Poor|Risky/);
  });

  it("collapses rating for a single-species overstock like edmontosaurus 6/5", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [{ dinosaurId: "edmontosaurus", males: 0, females: 6 }],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.breakdown.population).toBeGreaterThanOrEqual(20);
    expect(rating?.breakdown.population).toBeLessThan(40);
    expect(rating?.score).toBe(rating?.breakdown.population);
    expect(rating?.tier).toBe("Poor");
  });

  it("blocks mixed predator enclosures without explicit likes", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [
        { dinosaurId: "acrocanthosaurus", males: 2, females: 2 },
        { dinosaurId: "herrerasaurus", males: 0, females: 1 },
        { dinosaurId: "deinocheirus", males: 0, females: 1 },
      ],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.incompatible).toBe(true);
    expect(rating?.score).toBe(0);
    expect(rating?.tier).toBe("Incompatible");
    expect(rating?.breakdown.hasActiveDislike).toBe(true);
  });

  it("blocks active spreadsheet dislikes when stocked together", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [
        { dinosaurId: "sauropelta", males: 0, females: 2 },
        { dinosaurId: "ankylosaurus", males: 1, females: 0 },
      ],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.incompatible).toBe(true);
    expect(rating?.score).toBe(0);
    expect(rating?.tier).toBe("Incompatible");
    expect(rating?.breakdown.hasActiveDislike).toBe(true);
  });

  it("counts headcount across all members", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [
        { dinosaurId: "triceratops", males: 2, females: 2 },
        { dinosaurId: "ankylosaurus", males: 0, females: 3 },
      ],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.headcount).toBe(7);
    expect(rating?.speciesCount).toBe(2);
  });

  it("sums base appeal by headcount", () => {
    const state: EnclosureState = {
      type: "Land",
      members: [
        { dinosaurId: "acrocanthosaurus", males: 2, females: 2 },
        { dinosaurId: "compsognathus", males: 0, females: 1 },
      ],
    };
    const rating = computeEnclosureRating(state, all);
    const acro = all.find((d) => d.id === "acrocanthosaurus");
    const compy = all.find((d) => d.id === "compsognathus");
    expect(acro?.appeal).toBeDefined();
    expect(compy?.appeal).toBeDefined();
    expect(rating?.baseAppeal).toBe(
      (acro!.appeal ?? 0) * 4 + (compy!.appeal ?? 0),
    );
    expect(rating?.areaNeed).toMatchObject({ value: expect.any(String), label: expect.any(String) });
  });
});
