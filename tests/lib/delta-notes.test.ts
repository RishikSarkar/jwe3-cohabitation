import { describe, expect, it } from "vitest";
import { meaningfulDeltaNotes } from "@/lib/delta-notes";
import type { CandidateDelta } from "@/types/dinosaur";

const base: CandidateDelta = {
  terrain: "No new terrain types needed",
  newTerrainKeys: [],
  feederNotes: [{ text: "Shared Ground Fiber paleobotany", positive: true }],
  newFeedingTypes: [],
  socialNotes: [],
  space: "-",
};

describe("meaningfulDeltaNotes", () => {
  it("shows requirements, positives, blocks, and footprint notes", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        terrain: "+ Ground Fiber required",
        space: "Adds significant footprint",
        socialNotes: [
          "Velociraptor dislikes Indominus rex",
          "Tyrannosaurus likes Indominus rex",
          "Cohabitation discomfort with Atrociraptor",
        ],
      },
      "Indominus rex",
    );

    expect(notes).toEqual([
      { text: "Disliked by Velociraptor", incompatible: true },
      { text: "Cohabitation discomfort with Atrociraptor" },
      { text: "Liked by Tyrannosaurus", positive: true },
      { text: "+ Ground Fiber required" },
      { text: "Shared Ground Fiber paleobotany", positive: true },
      { text: "Adds significant footprint" },
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
      {
        text: "Likes Edmontosaurus +1 more",
        label: "Likes",
        names: ["Edmontosaurus", "Sauropelta"],
        positive: true,
      },
      { text: "Shared Ground Fiber paleobotany", positive: true },
    ]);
  });

  it("groups dislikes into disliked-by, dislikes, and mutual", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
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
      { text: "Disliked by Velociraptor", incompatible: true },
      { text: "Dislikes Herrerasaurus", incompatible: true },
    ]);
  });

  it("consolidates mutual and one-way dislikes for a candidate", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
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
      { text: "Mutual dislike with Acrocanthosaurus", incompatible: true },
      { text: "Disliked by Deinonychus", incompatible: true },
      { text: "Dislikes Compsognathus", incompatible: true },
    ]);
  });

  it("truncates multi-name social lists to one name plus more", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        feederNotes: [],
        socialNotes: [
          "Cohabitation discomfort with Acrocanthosaurus",
          "Cohabitation discomfort with Coelophysis",
          "Cohabitation discomfort with Moros intrepidus",
        ],
      },
      "Chungkingosaurus",
    );

    expect(notes[0]).toEqual({
      text: "Cohabitation discomfort with Acrocanthosaurus +2 more",
      label: "Cohabitation discomfort with",
      names: ["Acrocanthosaurus", "Coelophysis", "Moros intrepidus"],
    });
  });

  it("truncates long like lists", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
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

    expect(notes[0]).toEqual({
      text: "Likes Edmontosaurus +3 more",
      label: "Likes",
      names: ["Edmontosaurus", "Sauropelta", "Corythosaurus", "Dryosaurus"],
      positive: true,
    });
  });

  it("drops filler when nothing special applies", () => {
    expect(
      meaningfulDeltaNotes(
        {
          ...base,
          feederNotes: [{ text: "+ Carnivore feeder needed" }],
          terrain: "No new terrain types needed",
        },
        "Velociraptor",
      ).map((n) => n.text),
    ).toEqual(["+ Carnivore feeder needed"]);
  });

  it("includes footprint notes for heavy additions", () => {
    const notes = meaningfulDeltaNotes(
      {
        ...base,
        space: "Adds significant footprint",
      },
      "Triceratops",
    );
    expect(notes).toEqual([
      { text: "Shared Ground Fiber paleobotany", positive: true },
      { text: "Adds significant footprint" },
    ]);
  });
});

