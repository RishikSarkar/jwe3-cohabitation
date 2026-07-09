import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import {
  enclosureStatesEqual,
  paramsToEnclosure,
  sanitizeEnclosureState,
} from "@/lib/url-state";

const all = allDinosaurs;

describe("sanitizeEnclosureState", () => {
  it("removes unknown roster ids from shared URLs", () => {
    const params = new URLSearchParams({
      type: "Land",
      roster: "not-a-dino:1m0f,triceratops:1m0f",
    });
    const raw = paramsToEnclosure(params);
    const clean = sanitizeEnclosureState(raw, all);

    expect(clean.members).toEqual([
      { dinosaurId: "triceratops", males: 1, females: 0 },
    ]);
    expect(enclosureStatesEqual(raw, clean)).toBe(false);
  });

  it("removes species from the wrong enclosure type", () => {
    const params = new URLSearchParams({
      type: "Land",
      roster: "pteranodon:0m1f,triceratops:0m1f",
    });
    const clean = sanitizeEnclosureState(paramsToEnclosure(params), all);

    expect(clean.members.map((m) => m.dinosaurId)).toEqual(["triceratops"]);
  });
});
