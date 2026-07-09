import { describe, expect, it } from "vitest";
import { meaningfulDeltaNotes } from "@/lib/delta-notes";
import type { CandidateDelta } from "@/types/dinosaur";

const base: CandidateDelta = {
  terrain: "No new terrain types needed",
  newTerrainKeys: [],
  diet: "No feeder changes",
  feederNotes: [{ text: "Shared Ground Fiber paleobotany", positive: true }],
  newFeedingTypes: [],
  socialNotes: [],
  space: "Fits Standard enclosure",
};

describe("meaningfulDeltaNotes", () => {
  it("shows requirements, positives, blocks, and space pressure", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        terrain: "+ Ground Fiber required",
        space: "May need larger enclosure",
        socialNotes: [
          "Velociraptor dislikes Indominus rex",
          "Tyrannosaurus likes Indominus rex",
          "Neutral with Atrociraptor (−comfort)",
        ],
      },
      "Indominus rex",
    );

    expect(notes).toEqual([
      { text: "Disliked by Velociraptor", blocked: true },
      { text: "Liked by Tyrannosaurus", positive: true },
      { text: "+ Ground Fiber required" },
      { text: "Shared Ground Fiber paleobotany", positive: true },
      { text: "May need larger enclosure" },
    ]);
  });

  it("groups likes into liked-by, likes, and mutual", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        socialNotes: [
          "Acrocanthosaurus likes Coelophysis",
          "Coelophysis likes Acrocanthosaurus",
          "Coelophysis likes Edmontosaurus",
          "Coelophysis likes Sauropelta",
        ],
      },
      "Coelophysis",
    );

    expect(notes).toEqual([
      { text: "Mutual like with Acrocanthosaurus", positive: true },
      { text: "Likes Edmontosaurus, Sauropelta", positive: true },
      { text: "Shared Ground Fiber paleobotany", positive: true },
    ]);
  });

  it("groups dislikes into disliked-by, dislikes, and mutual", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        diet: "-",
        feederNotes: [],
        socialNotes: [
          "Tapejara and Tropeognathus dislike each other",
          "Velociraptor dislikes Indominus rex",
          "Indominus rex dislikes Herrerasaurus",
        ],
      },
      "Indominus rex",
    );

    expect(notes).toEqual([
      { text: "Disliked by Velociraptor", blocked: true },
      { text: "Dislikes Herrerasaurus", blocked: true },
    ]);
  });

  it("consolidates mutual and one-way dislikes for a candidate", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        diet: "-",
        feederNotes: [],
        socialNotes: [
          "Acrocanthosaurus and Velociraptor dislike each other",
          "Deinonychus dislikes Velociraptor",
          "Velociraptor dislikes Compsognathus",
        ],
      },
      "Velociraptor",
    );

    expect(notes).toEqual([
      { text: "Mutual dislike with Acrocanthosaurus", blocked: true },
      { text: "Disliked by Deinonychus", blocked: true },
      { text: "Dislikes Compsognathus", blocked: true },
    ]);
  });

  it("truncates long like lists", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        diet: "-",
        feederNotes: [],
        socialNotes: [
          "Coelophysis likes Edmontosaurus",
          "Coelophysis likes Sauropelta",
          "Coelophysis likes Corythosaurus",
          "Coelophysis likes Dryosaurus",
        ],
      },
      "Coelophysis",
    );

    expect(notes[0]?.text).toBe(
      "Likes Edmontosaurus, Sauropelta, Corythosaurus +1 more",
    );
  });

  it("drops filler when nothing special applies", () => {
    expect(
      meaningfulDeltaNotes(
        {
          ...base,
          diet: "+ Carnivore feeder needed",
          feederNotes: [{ text: "+ Carnivore feeder needed" }],
          terrain: "No new terrain types needed",
        },
        "Velociraptor",
      ).map((n) => n.text),
    ).toEqual(["+ Carnivore feeder needed"]);
  });

  it("includes tight-fit space warnings", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        space: "Tight fit for Standard",
      },
      "Triceratops",
    );
    expect(notes).toEqual([
      { text: "Shared Ground Fiber paleobotany", positive: true },
      { text: "Tight fit for Standard" },
    ]);
  });
});
