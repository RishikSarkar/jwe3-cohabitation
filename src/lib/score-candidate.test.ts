import { describe, expect, it } from "vitest";
import dinosaurs from "@/data/dinosaurs.json";
import { meaningfulDeltaNotes } from "@/lib/delta-notes";
import { scoreAllDinosaurs, sortScoredRows } from "@/lib/score-candidate";
import type { Dinosaur, EnclosureState, ScoredCandidate } from "@/types/dinosaur";

const all = dinosaurs as Dinosaur[];

describe("scoreAllDinosaurs", () => {
  it("sorts by name when enclosure is empty", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [],
    };
    const rows = sortScoredRows(
      scoreAllDinosaurs(state, all),
      "name",
      false,
    );
    const names = rows.map((r) => r.dinosaur.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("marks enclosure members as inEnclosure", () => {
    const trike = all.find((d) => d.id === "triceratops");
    if (!trike) throw new Error("missing triceratops");
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [{ dinosaurId: trike.id, males: 1, females: 0 }],
    };
    const rows = scoreAllDinosaurs(state, all);
    const self = rows.find((r) => r.dinosaur.id === "triceratops");
    expect(self?.inEnclosure).toBe(true);
    expect(self?.score).toBeNull();
  });

  it("sorts compatibility by score only, not base appeal", () => {
    const low = all.find((d) => d.id === "dryosaurus");
    const high = all.find((d) => d.id === "deinocheirus");
    if (!low?.appeal || !high?.appeal) {
      throw new Error("expected appeal on fixture dinosaurs");
    }
    expect(high.appeal).toBeGreaterThan(low.appeal);

    const row = (d: Dinosaur, score: number): ScoredCandidate => ({
      dinosaur: d,
      score,
      tier: "Good",
      blocked: false,
      inEnclosure: false,
      delta: {
        terrain: "-",
        newTerrainKeys: [],
        diet: "-",
        feederNotes: [],
        newFeedingTypes: [],
        socialNotes: [],
        space: "-",
      },
      breakdown: {
        habitatCosine: 0,
        sharedKeyCoverage: 0,
        envelopeTightness: 0,
        dietCompatibility: 0,
        cohabitation: 0,
        spaceHeadroom: 0,
      },
    });

    const sorted = sortScoredRows(
      [row(low, 75), row(high, 74)],
      "compatibility",
      true,
    );
    expect(sorted[0]?.dinosaur.id).toBe("dryosaurus");
  });

  it("sorts by base appeal descending", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [],
    };
    const rows = sortScoredRows(scoreAllDinosaurs(state, all), "appeal", false);
    const appeals = rows.map((r) => r.dinosaur.appeal ?? 0);
    expect(appeals).toEqual([...appeals].sort((a, b) => b - a));
    expect(rows[0]?.dinosaur.id).toBe("indoraptor");
  });

  it("recommended sort prefers strong compatibility with a boost from appeal", () => {
    const trike = all.find((d) => d.id === "triceratops");
    const dryo = all.find((d) => d.id === "dryosaurus");
    if (!trike?.appeal || !dryo?.appeal) {
      throw new Error("expected appeal on fixture dinosaurs");
    }

    const row = (d: Dinosaur, score: number): ScoredCandidate => ({
      dinosaur: d,
      score,
      tier: "Good",
      blocked: false,
      inEnclosure: false,
      delta: {
        terrain: "-",
        newTerrainKeys: [],
        diet: "-",
        feederNotes: [],
        newFeedingTypes: [],
        socialNotes: [],
        space: "-",
      },
      breakdown: {
        habitatCosine: 0,
        sharedKeyCoverage: 0,
        envelopeTightness: 0,
        dietCompatibility: 0,
        cohabitation: 0,
        spaceHeadroom: 0,
      },
    });

    const rows = [row(dryo, 60), row(trike, 80)];
    const sorted = sortScoredRows(rows, "recommended", true);
    expect(sorted[0]?.dinosaur.id).toBe("triceratops");
  });

  it("records mutual likes in both directions for ankylodocus and diplodocus", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [{ dinosaurId: "ankylodocus", males: 0, females: 1 }],
    };
    const diplo = scoreAllDinosaurs(state, all).find(
      (r) => r.dinosaur.id === "diplodocus",
    );
    expect(diplo?.delta.socialNotes).toEqual(
      expect.arrayContaining([
        "Ankylodocus likes Diplodocus",
        "Diplodocus likes Ankylodocus",
      ]),
    );

    const notes = meaningfulDeltaNotes(diplo!.delta, "Diplodocus");
    expect(notes.some((n) => n.text === "Mutual like with Ankylodocus")).toBe(
      true,
    );
    expect(notes.some((n) => n.text === "Shared Tall Fruit paleobotany")).toBe(
      true,
    );
    expect(notes.some((n) => n.text === "No new feeder type")).toBe(false);
  });

  it("penalizes carnivores in herbivore enclosures without a social block", () => {
    const state: EnclosureState = {
      type: "Land",
      size: "Standard",
      members: [{ dinosaurId: "ankylodocus", males: 0, females: 1 }],
    };
    const velo = scoreAllDinosaurs(state, all, { showBlocked: true }).find(
      (r) => r.dinosaur.id === "velociraptor",
    );
    expect(velo?.blocked).toBe(false);
    expect(velo?.tier).not.toBe("Blocked");
    expect(velo?.score).toBeGreaterThan(0);
    expect(velo?.delta.diet).toBe("+ Carnivore feeder needed");
    expect(velo?.delta.feederNotes).toEqual([
      { text: "+ Carnivore feeder needed" },
    ]);
    expect(velo?.breakdown.dietCompatibility).toBe(0);
  });
});
