import type { CandidateDelta } from "@/types/dinosaur";

export type DeltaNote = {
  text: string;
  positive?: boolean;
};

/** Only show compatibility notes that matter — requirements or positives. */
export function meaningfulDeltaNotes(delta: CandidateDelta): DeltaNote[] {
  const lines: DeltaNote[] = [];

  if (delta.terrain.startsWith("+")) {
    lines.push({ text: delta.terrain });
  }

  if (delta.diet === "Same feeders") {
    lines.push({ text: delta.diet, positive: true });
  } else if (delta.diet.startsWith("+")) {
    lines.push({ text: delta.diet });
  }

  for (const note of delta.socialNotes) {
    if (/\blikes\b/i.test(note)) {
      lines.push({ text: note, positive: true });
    }
  }

  return lines;
}
