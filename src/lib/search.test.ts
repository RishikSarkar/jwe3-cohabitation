import { describe, expect, it } from "vitest";
import { matchesDinoSearch } from "./search";
import type { DinoSearchFields } from "./search";

function dino(partial: Partial<DinoSearchFields> & Pick<DinoSearchFields, "name" | "id">) {
  return {
    family: "",
    threatClass: "Herbivore",
    enclosureType: "Land",
    ...partial,
  };
}

describe("matchesDinoSearch", () => {
  it("matches by species name", () => {
    const trike = dino({ name: "Triceratops", id: "triceratops", family: "Ceratopsid" });
    expect(matchesDinoSearch("tric", trike)).toBe(true);
    expect(matchesDinoSearch("raptor", trike)).toBe(false);
  });

  it("matches all members of a family group alias", () => {
    const trike = dino({ name: "Triceratops", id: "triceratops", family: "Ceratopsid" });
    const stego = dino({ name: "Stegosaurus", id: "stegosaurus", family: "Stegosaurid" });
    expect(matchesDinoSearch("ceratops", trike)).toBe(true);
    expect(matchesDinoSearch("ceratops", stego)).toBe(false);
  });

  it("matches hadrosaur shorthand across the family", () => {
    const para = dino({ name: "Parasaurolophus", id: "parasaurolophus", family: "Hadrosaurid" });
    const iguan = dino({ name: "Iguanodon", id: "iguanodon", family: "Hadrosaurid" });
    const trike = dino({ name: "Triceratops", id: "triceratops", family: "Ceratopsid" });
    expect(matchesDinoSearch("hadrosaur", para)).toBe(true);
    expect(matchesDinoSearch("hadrosaur", iguan)).toBe(true);
    expect(matchesDinoSearch("hadrosaur", trike)).toBe(false);
  });

  it("matches scavenger family group", () => {
    const compy = dino({
      name: "Compsognathus",
      id: "compsognathus",
      family: "Scavenger",
      threatClass: "Scavenger",
    });
    const raptor = dino({
      name: "Velociraptor",
      id: "velociraptor",
      family: "Carnivore",
      threatClass: "Carnivore",
    });
    expect(matchesDinoSearch("scavenger", compy)).toBe(true);
    expect(matchesDinoSearch("scavengers", compy)).toBe(true);
    expect(matchesDinoSearch("scavenger", raptor)).toBe(false);
  });

  it("matches aviary enclosure when family is unknown", () => {
    const ptera = dino({
      name: "Pteranodon",
      id: "pteranodon",
      family: "Unknown",
      enclosureType: "Aviary",
    });
    expect(matchesDinoSearch("aviary", ptera)).toBe(true);
    expect(matchesDinoSearch("ceratops", ptera)).toBe(false);
  });

  it("matches marine threat class for lagoon species", () => {
    const mosasaurus = dino({
      name: "Mosasaurus",
      id: "mosasaurus",
      family: "Unknown",
      threatClass: "Marine",
      enclosureType: "Lagoon",
    });
    expect(matchesDinoSearch("marine", mosasaurus)).toBe(true);
    expect(matchesDinoSearch("lagoon", mosasaurus)).toBe(true);
  });

  it("returns true for empty query", () => {
    const trike = dino({ name: "Triceratops", id: "triceratops", family: "Ceratopsid" });
    expect(matchesDinoSearch("", trike)).toBe(true);
    expect(matchesDinoSearch("   ", trike)).toBe(true);
  });

  it("matches regex against id and family, not only name", () => {
    const utah = dino({
      name: "Utahraptor",
      id: "utahraptor",
      family: "Carnivore",
      threatClass: "Carnivore",
    });
    expect(matchesDinoSearch("/utah/", utah)).toBe(true);
    expect(matchesDinoSearch("/carnivore/", utah)).toBe(true);
    expect(matchesDinoSearch("/raptor$/", utah)).toBe(true);
    expect(matchesDinoSearch("/ceratops/", utah)).toBe(false);
  });
});
