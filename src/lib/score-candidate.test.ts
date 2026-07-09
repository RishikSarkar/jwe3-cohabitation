import { describe, expect, it } from "vitest";
import dinosaurs from "@/data/dinosaurs.json";
import { scoreAllDinosaurs, sortScoredRows } from "@/lib/score-candidate";
import type { Dinosaur, EnclosureState } from "@/types/dinosaur";

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
});
