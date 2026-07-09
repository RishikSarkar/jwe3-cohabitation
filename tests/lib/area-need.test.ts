import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import {
  candidateFootprintNote,
  computeAreaDemandLoad,
  enclosureAreaNeedStat,
} from "@/lib/area-need";

const all = allDinosaurs;

function entry(id: string, count: number) {
  const dinosaur = all.find((d) => d.id === id);
  if (!dinosaur) throw new Error(`missing ${id}`);
  return { dinosaur, count };
}

describe("area-need", () => {
  it("returns XS territory for a tiny single-species roster", () => {
    const stat = enclosureAreaNeedStat([entry("compsognathus", 2)]);
    expect(stat).toEqual({ value: "XS", label: "territory" });
  });

  it("rates a sparse multi-species roster above XS", () => {
    const stat = enclosureAreaNeedStat([
      entry("tsintaosaurus", 1),
      entry("compsognathus", 1),
      entry("maiasaura", 1),
      entry("patagotitan", 1),
    ]);
    expect(stat?.value).not.toBe("XS");
    expect(["S", "M"]).toContain(stat?.value);
  });

  it("rates a balanced mixed herd around M territory", () => {
    const stat = enclosureAreaNeedStat([
      entry("ankylodocus", 1),
      entry("dreadnoughtus", 1),
      entry("chungkingosaurus", 3),
      entry("coelophysis", 6),
    ]);
    expect(stat?.value).toBe("M");
  });

  it("recommends M territory for a large mixed herd", () => {
    const stat = enclosureAreaNeedStat([
      entry("triceratops", 8),
      entry("ankylosaurus", 6),
    ]);
    expect(stat?.value).toBe("M");
  });

  it("flags elevated area-need species as XL territory", () => {
    const stat = enclosureAreaNeedStat([entry("indominus-rex", 1)]);
    expect(stat).toEqual({ value: "XL", label: "territory" });
  });

  it("describes heavy candidate footprint relative to current load", () => {
    const compy = all.find((d) => d.id === "compsognathus")!;
    const trike = all.find((d) => d.id === "triceratops")!;
    const currentLoad = computeAreaDemandLoad([{ dinosaur: compy, count: 2 }]);
    expect(candidateFootprintNote(currentLoad, trike)).toBe(
      "Adds significant footprint",
    );
  });
});
