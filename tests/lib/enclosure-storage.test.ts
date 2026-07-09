import { describe, expect, it } from "vitest";
import {
  applyUrlToMemory,
  defaultMemory,
  parseStoredSession,
  stateFromMemory,
  updateMemoryForType,
} from "@/lib/enclosure-storage";
import type { EnclosureState } from "@/types/dinosaur";

describe("enclosure-storage", () => {
  it("keeps separate snapshots per enclosure type", () => {
    const memory = defaultMemory();
    const land: EnclosureState = {
      type: "Land",
      members: [{ dinosaurId: "triceratops", males: 1, females: 2 }],
    };
    const withLand = updateMemoryForType(memory, land);
    const aviary = stateFromMemory("Aviary", withLand);
    expect(aviary.members).toEqual([]);
    expect(withLand.Land.members).toHaveLength(1);
  });

  it("restores land roster after switching away and back", () => {
    let memory = defaultMemory();
    const land: EnclosureState = {
      type: "Land",
      members: [{ dinosaurId: "ankylosaurus", males: 0, females: 1 }],
    };
    memory = updateMemoryForType(memory, land);
    memory = updateMemoryForType(memory, stateFromMemory("Aviary", memory));
    const back = stateFromMemory("Land", memory);
    expect(back.members[0]?.dinosaurId).toBe("ankylosaurus");
  });

  it("applies shared URL roster to the matching enclosure type only", () => {
    const memory = defaultMemory();
    const urlState: EnclosureState = {
      type: "Lagoon",
      members: [{ dinosaurId: "mosasaurus", males: 0, females: 1 }],
    };
    const next = applyUrlToMemory(memory, urlState, true);
    expect(next.Lagoon.members).toHaveLength(1);
    expect(next.Land.members).toHaveLength(0);
  });

  it("parses stored session safely and migrates legacy showBlocked", () => {
    const parsed = parseStoredSession({
      enclosures: {
        Land: {
          size: "Compact",
          members: [{ dinosaurId: "x", males: 1, females: 0 }],
        },
      },
      ui: { sortMode: "appeal", showBlocked: true },
    });
    expect(parsed.enclosures.Land.members).toHaveLength(1);
    expect(parsed.ui.sortMode).toBe("appeal");
    expect(parsed.ui.showIncompatible).toBe(true);

    const modern = parseStoredSession({
      ui: { sortMode: "name", showIncompatible: true },
    });
    expect(modern.ui.showIncompatible).toBe(true);
  });
});
