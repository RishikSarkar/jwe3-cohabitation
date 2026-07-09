import { describe, expect, it } from "vitest";
import { meaningfulDeltaNotes } from "./delta-notes";
import type { CandidateDelta } from "@/types/dinosaur";

const base: CandidateDelta = {
  terrain: "No new terrain types needed",
  newTerrainKeys: [],
  diet: "Same feeders",
  newFeedingTypes: [],
  socialNotes: [],
  space: "Fits Standard enclosure",
};

describe("meaningfulDeltaNotes", () => {
  it("keeps only positives and requirements", () => {
    const notes = meaningfulDeltaNotes({
      ...base,
      terrain: "+ Ground Fiber required",
      socialNotes: [
        "Chungkingosaurus likes Tsintaosaurus ✓",
        "Neutral with Atrociraptor (−comfort)",
      ],
    });

    expect(notes.map((n) => n.text)).toEqual([
      "+ Ground Fiber required",
      "Same feeders",
      "Chungkingosaurus likes Tsintaosaurus ✓",
    ]);
  });

  it("drops filler when nothing special applies", () => {
    expect(
      meaningfulDeltaNotes({
        ...base,
        diet: "+ Carnivore needed",
        terrain: "No new terrain types needed",
      }).map((n) => n.text),
    ).toEqual(["+ Carnivore needed"]);
  });
});
