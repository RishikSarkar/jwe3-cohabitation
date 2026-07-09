import { describe, expect, it } from "vitest";
import dinosaurs from "@/data/dinosaurs.json";
import { computeEnclosureRating } from "./enclosure-rating";
import type { Dinosaur, EnclosureState } from "@/types/dinosaur";

const all = dinosaurs as Dinosaur[];

describe("computeEnclosureRating", () => {
  it("returns null for an empty enclosure", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [],
    };
    expect(computeEnclosureRating(state, all)).toBeNull();
  });

  it("rates a single-species enclosure as excellent", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [{ dinosaurId: "acrocanthosaurus", males: 2, females: 2 }],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.score).toBe(100);
    expect(rating?.tier).toBe("Excellent");
    expect(rating?.breakdown.social).toBe(100);
  });

  it("blocks mixed predator enclosures without explicit likes", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [
        { dinosaurId: "acrocanthosaurus", males: 2, females: 2 },
        { dinosaurId: "herrerasaurus", males: 0, females: 1 },
        { dinosaurId: "deinocheirus", males: 0, females: 1 },
      ],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.blocked).toBe(true);
    expect(rating?.score).toBe(0);
    expect(rating?.tier).toBe("Blocked");
    expect(rating?.breakdown.hasActiveDislike).toBe(true);
  });

  it("blocks active spreadsheet dislikes when stocked together", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [
        { dinosaurId: "sauropelta", males: 0, females: 2 },
        { dinosaurId: "ankylosaurus", males: 1, females: 0 },
      ],
    };
    const rating = computeEnclosureRating(state, all);
    expect(rating?.blocked).toBe(true);
    expect(rating?.score).toBe(0);
    expect(rating?.tier).toBe("Blocked");
    expect(rating?.breakdown.hasActiveDislike).toBe(true);
  });

  it("counts headcount across all members", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Spacious",
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
      size: "Standard",
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
  });
});
