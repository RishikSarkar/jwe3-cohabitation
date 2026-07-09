import { describe, expect, it } from "vitest";
import { allDinosaurs } from "@/lib/dinosaur-catalog";
import { buildEnclosureProfile, envelopeWidenDelta } from "@/lib/enclosure";
import { buildFeederDelta } from "@/lib/feeder-delta";
import type { EnclosureState } from "@/types/dinosaur";

const all = allDinosaurs;

function profileFor(memberId: string) {
  const state: EnclosureState = {
    type: "Land",
    members: [{ dinosaurId: memberId, males: 0, females: 1 }],
  };
  return buildEnclosureProfile(state, all)!;
}

describe("buildFeederDelta", () => {
  it("flags new paleobotany for patagotitan with ankylodocus", () => {
    const patagotitan = all.find((d) => d.id === "patagotitan")!;
    const profile = profileFor("ankylodocus");
    const { newKeys } = envelopeWidenDelta(profile.envelope, patagotitan);

    const { notes } = buildFeederDelta(patagotitan, profile, newKeys);
    expect(notes).toEqual(
      expect.arrayContaining([
        { text: "Shared Tall Fruit paleobotany", positive: true },
      ]),
    );
    expect(notes.some((n) => n.text.includes("Tall Fiber paleobotany"))).toBe(
      false,
    );
    expect(notes.some((n) => n.text === "No new feeder type")).toBe(false);
  });

  it("shows shared paleobotany for diplodocus with ankylodocus", () => {
    const diplodocus = all.find((d) => d.id === "diplodocus")!;
    const profile = profileFor("ankylodocus");

    const { notes } = buildFeederDelta(diplodocus, profile);
    expect(notes).toEqual([
      { text: "Shared Tall Fruit paleobotany", positive: true },
    ]);
  });

  it("asks for a carnivore feeder instead of vague diet text", () => {
    const coelophysis = all.find((d) => d.id === "coelophysis")!;
    const profile = profileFor("ankylodocus");

    const { notes } = buildFeederDelta(coelophysis, profile);
    expect(notes).toEqual([{ text: "+ Carnivore feeder needed" }]);
  });

  it("flags new paleobotany and terrain for dreadnoughtus with ankylodocus", () => {
    const dreadnoughtus = all.find((d) => d.id === "dreadnoughtus")!;
    const profile = profileFor("ankylodocus");
    const { newKeys } = envelopeWidenDelta(profile.envelope, dreadnoughtus);

    const { notes } = buildFeederDelta(dreadnoughtus, profile, newKeys);
    expect(notes).toEqual(
      expect.arrayContaining([
        { text: "Shared Tall Fruit paleobotany", positive: true },
      ]),
    );
    expect(notes.some((n) => n.text.includes("Tall Fiber paleobotany"))).toBe(
      false,
    );
  });

  it("omits paleobotany lines already covered by terrain requirements", () => {
    const chungkingosaurus = all.find((d) => d.id === "chungkingosaurus")!;
    const profile = profileFor("ankylodocus");
    const { newKeys } = envelopeWidenDelta(
      profile.envelope,
      chungkingosaurus,
    );

    const { notes } = buildFeederDelta(chungkingosaurus, profile, newKeys);
    expect(notes.some((n) => n.text.includes("paleobotany needed"))).toBe(
      false,
    );
    expect(notes.some((n) => n.text.includes("feeder needed"))).toBe(false);
  });

  it("omits duplicate paleobotany for maiasaura ground crops", () => {
    const maiasaura = all.find((d) => d.id === "maiasaura")!;
    const profile = profileFor("ankylodocus");
    const { newKeys } = envelopeWidenDelta(profile.envelope, maiasaura);

    const { notes } = buildFeederDelta(maiasaura, profile, newKeys);
    expect(notes.some((n) => n.text.includes("paleobotany needed"))).toBe(
      false,
    );
    expect(notes.some((n) => n.text.includes("feeder needed"))).toBe(false);
  });

  it("still shows palaeobotany feeder when crops are already shared", () => {
    const profile = profileFor("ankylodocus");
    const candidate = {
      ...all.find((d) => d.id === "chungkingosaurus")!,
      habitat: { cover: 10, pasture: 20, water: 10, groundFruit: 30 },
    };
    const { notes } = buildFeederDelta(candidate, profile, []);
    expect(notes).toContainEqual({
      text: "+ Ground Palaeobotany feeder needed",
    });
  });
});