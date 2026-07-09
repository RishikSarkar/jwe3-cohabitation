import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import { jwe3DinosaurUrl } from "@/lib/jwe3-url";

describe("jwe3DinosaurUrl", () => {
  it("builds official species URLs from dinosaur id", () => {
    expect(jwe3DinosaurUrl("acrocanthosaurus")).toBe(
      "https://www.jurassicworldevolution.com/en-US/3/dinosaurs/acrocanthosaurus",
    );
    expect(jwe3DinosaurUrl("tyrannosaurus-rex")).toBe(
      "https://www.jurassicworldevolution.com/en-US/3/dinosaurs/tyrannosaurus-rex",
    );
  });

  it("covers every species id in the dataset", () => {
    for (const dino of allDinosaurs) {
      expect(jwe3DinosaurUrl(dino.id)).toMatch(
        /^https:\/\/www\.jurassicworldevolution\.com\/en-US\/3\/dinosaurs\/[a-z0-9-]+$/,
      );
    }
  });
});
