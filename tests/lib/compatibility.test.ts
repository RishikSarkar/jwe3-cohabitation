import { describe, expect, it } from "vitest";
import {
  describeCohabBlock,
  isBlockedPair,
  resolveCohabitation,
} from "@/lib/compatibility";
import { cosineSimilarity, habitatToVector } from "@/lib/vectors";
import type { Dinosaur } from "@/types/dinosaur";

function dino(partial: Partial<Dinosaur> & Pick<Dinosaur, "id" | "name">): Dinosaur {
  return {
    enclosureType: "Land",
    feedingType: "Ground Palaeobotany",
    threatClass: "Herbivore",
    era: "Late Cretaceous",
    family: "Ceratopsid",
    size: "Medium",
    habitat: {},
    cohabitation: { likes: [], dislikes: [] },
    image: "",
    ...partial,
  };
}

describe("resolveCohabitation", () => {
  it("blocks tapejara and tropeognathus mutual dislike", () => {
    const tapejara = dino({
      id: "tapejara",
      name: "Tapejara",
      enclosureType: "Aviary",
      cohabitation: {
        likes: [],
        dislikes: [{ kind: "species", id: "tropeognathus" }],
      },
    });
    const trope = dino({
      id: "tropeognathus",
      name: "Tropeognathus",
      enclosureType: "Aviary",
      cohabitation: {
        likes: [],
        dislikes: [{ kind: "species", id: "tapejara" }],
      },
    });
    expect(isBlockedPair(tapejara, trope)).toBe(true);
    expect(describeCohabBlock(tapejara, trope)).toBe(
      "Tapejara and Tropeognathus dislike each other",
    );
  });

  it("blocks when one species dislikes the other", () => {
    const deino = dino({
      id: "deinocheirus",
      name: "Deinocheirus",
      threatClass: "Piscivore",
      size: "Large",
      cohabitation: {
        likes: [],
        dislikes: [{ kind: "meta", tag: "LargeCarnivores" }],
      },
    });
    const acro = dino({
      id: "acrocanthosaurus",
      name: "Acrocanthosaurus",
      threatClass: "Carnivore",
      size: "Large",
    });
    const herrera = dino({
      id: "herrerasaurus",
      name: "Herrerasaurus",
      threatClass: "Carnivore",
      size: "Small",
      cohabitation: {
        likes: [{ kind: "meta", tag: "Scavenger" }],
        dislikes: [],
      },
    });
    expect(resolveCohabitation(deino, acro)).toBe("disliked");
    expect(isBlockedPair(deino, acro)).toBe(true);
    expect(describeCohabBlock(deino, acro)).toBe(
      "Deinocheirus dislikes Acrocanthosaurus",
    );
    expect(isBlockedPair(acro, herrera)).toBe(false);
  });

  it("allows carnivore pairs with an explicit like", () => {
    const allo = dino({
      id: "allosaurus",
      name: "Allosaurus",
      threatClass: "Carnivore",
      cohabitation: {
        likes: [{ kind: "species", id: "ceratosaurus" }],
        dislikes: [],
      },
    });
    const cerato = dino({
      id: "ceratosaurus",
      name: "Ceratosaurus",
      threatClass: "Carnivore",
    });
    expect(isBlockedPair(allo, cerato)).toBe(false);
    expect(resolveCohabitation(allo, cerato)).toBe("liked");
  });

  it("likes when family tag matches", () => {
    const trike = dino({
      id: "triceratops",
      name: "Triceratops",
      cohabitation: {
        likes: [{ kind: "family", id: "Ankylosaurid" }],
        dislikes: [],
      },
    });
    const ankyl = dino({
      id: "ankylosaurus",
      name: "Ankylosaurus",
      family: "Ankylosaurid",
    });
    expect(resolveCohabitation(trike, ankyl)).toBe("liked");
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical habitat vectors", () => {
    const h = { pasture: 60, barren: 40 };
    const a = habitatToVector(h);
    const b = habitatToVector(h);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });

  it("returns higher score for overlapping habitats", () => {
    const a = habitatToVector({ pasture: 50, barren: 50 });
    const b = habitatToVector({ pasture: 50, wetland: 50 });
    const c = habitatToVector({ water: 100 });
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));
  });
});
