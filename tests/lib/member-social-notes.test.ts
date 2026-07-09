import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import { memberSocialRiskNotes } from "@/lib/member-social-notes";

const all = allDinosaurs;

describe("memberSocialRiskNotes", () => {
  it("flags overcrowding for a stocked species", () => {
    const acro = all.find((d) => d.id === "acrocanthosaurus")!;
    const notes = memberSocialRiskNotes(
      acro,
      { dinosaurId: acro.id, males: 3, females: 3 },
      [acro],
    );
    expect(notes.some((note) => note.text.startsWith("Overcrowded"))).toBe(
      true,
    );
  });

  it("flags active dislikes with other stocked species", () => {
    const sauropelta = all.find((d) => d.id === "sauropelta")!;
    const ankylosaurus = all.find((d) => d.id === "ankylosaurus")!;
    const notes = memberSocialRiskNotes(
      sauropelta,
      { dinosaurId: sauropelta.id, males: 0, females: 2 },
      [sauropelta, ankylosaurus],
    );
    expect(notes.some((note) => note.incompatible)).toBe(true);
  });

  it("shows mutual likes as positive notes", () => {
    const triceratops = all.find((d) => d.id === "triceratops")!;
    const dryosaurus = all.find((d) => d.id === "dryosaurus")!;
    const notes = memberSocialRiskNotes(
      triceratops,
      { dinosaurId: triceratops.id, males: 0, females: 2 },
      [triceratops, dryosaurus],
    );
    expect(notes.some((note) => note.positive)).toBe(true);
  });
});
