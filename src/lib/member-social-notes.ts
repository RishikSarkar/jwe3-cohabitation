import type { Dinosaur, EnclosureMember } from "@/types/dinosaur";
import {
  describeCohabIncompatibility,
  isIncompatiblePair,
  pairCohabitationScore,
  resolveCohabitation,
} from "./compatibility";
import { consolidateSocialNotes, type DeltaNote } from "./delta-notes";
import { speciesPopulationComfort } from "./population";

/** Social risks for a stocked species — population and cohabitation only. */
export function memberSocialRiskNotes(
  dinosaur: Dinosaur,
  member: EnclosureMember,
  stockedDinosaurs: Dinosaur[],
): DeltaNote[] {
  const otherMembers = stockedDinosaurs.filter((d) => d.id !== dinosaur.id);
  const lines: DeltaNote[] = [];

  const population = speciesPopulationComfort(
    dinosaur,
    member.males,
    member.females,
  );
  for (const text of population.notes) {
    lines.push({ text });
  }

  const socialNotes: string[] = [];
  for (const other of otherMembers) {
    if (isIncompatiblePair(dinosaur, other)) {
      socialNotes.push(describeCohabIncompatibility(dinosaur, other));
      continue;
    }

    const selfToOther = resolveCohabitation(dinosaur, other);
    const otherToSelf = resolveCohabitation(other, dinosaur);

    if (selfToOther === "liked") {
      socialNotes.push(`${dinosaur.name} likes ${other.name}`);
    }
    if (otherToSelf === "liked") {
      socialNotes.push(`${other.name} likes ${dinosaur.name}`);
    }

    const pair = pairCohabitationScore(dinosaur, other);
    if (pair.score < 100) {
      socialNotes.push(`Cohabitation discomfort with ${other.name}`);
    }
  }

  lines.push(...consolidateSocialNotes(socialNotes, dinosaur.name));
  return lines;
}
