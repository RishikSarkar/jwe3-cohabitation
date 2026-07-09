import type { CandidateDelta } from "@/types/dinosaur";

export type DeltaNote = {
  text: string;
  positive?: boolean;
  incompatible?: boolean;
  /** Prefix before dinosaur names when using truncated list UI. */
  label?: string;
  /** Full name list for truncated social notes. */
  names?: string[];
};

function isDislikeNote(note: string): boolean {
  return /\bdislikes?\b/i.test(note) && !/\blikes\b/i.test(note);
}

function isSpaceWarning(space: string): boolean {
  return space.startsWith("Adds ");
}

function buildNameListNote(
  label: string,
  names: string[],
  flags: Pick<DeltaNote, "positive" | "incompatible"> = {},
): DeltaNote {
  if (names.length === 0) {
    return { text: label.trim(), ...flags };
  }
  if (names.length === 1) {
    return { text: `${label} ${names[0]}`, ...flags };
  }
  return {
    text: `${label} ${names[0]} +${names.length - 1} more`,
    label,
    names,
    ...flags,
  };
}

function otherParty(
  candidateName: string,
  a: string,
  b: string,
): string | null {
  if (a === candidateName) return b;
  if (b === candidateName) return a;
  return null;
}

export function consolidateSocialNotes(
  socialNotes: string[],
  candidateName: string,
): DeltaNote[] {
  const incomingLikes: string[] = [];
  const outgoingLikes: string[] = [];
  const dislikedBy: string[] = [];
  const dislikes: string[] = [];
  const mutualDislikes: string[] = [];
  const discomfortWith: string[] = [];

  for (const note of socialNotes) {
    const discomfort = note.match(/^Cohabitation discomfort with (.+)$/i);
    if (discomfort) {
      discomfortWith.push(discomfort[1]!);
      continue;
    }

    const mutualDislike = note.match(/^(.+?) and (.+?) dislike each other$/i);
    if (mutualDislike) {
      const other = otherParty(
        candidateName,
        mutualDislike[1]!,
        mutualDislike[2]!,
      );
      if (other) mutualDislikes.push(other);
      continue;
    }

    if (isDislikeNote(note)) {
      const dislike = note.match(/^(.+?) dislikes (.+)$/i);
      if (dislike) {
        const [, from, to] = dislike;
        if (to === candidateName) dislikedBy.push(from);
        else if (from === candidateName) dislikes.push(to);
      }
      continue;
    }

    const like = note.match(/^(.+?) likes (.+)$/i);
    if (like) {
      const [, from, to] = like;
      if (to === candidateName) incomingLikes.push(from);
      else if (from === candidateName) outgoingLikes.push(to);
    }
  }

  const mutualLikes = incomingLikes.filter((name) => outgoingLikes.includes(name));
  const mutualLikeSet = new Set(mutualLikes);
  const likedBy = incomingLikes.filter((name) => !mutualLikeSet.has(name));
  const likes = outgoingLikes.filter((name) => !mutualLikeSet.has(name));

  const lines: DeltaNote[] = [];

  if (mutualDislikes.length > 0) {
    lines.push(
      buildNameListNote("Mutual dislike with", mutualDislikes, {
        incompatible: true,
      }),
    );
  }
  if (dislikedBy.length > 0) {
    lines.push(
      buildNameListNote("Disliked by", dislikedBy, { incompatible: true }),
    );
  }
  if (dislikes.length > 0) {
    lines.push(buildNameListNote("Dislikes", dislikes, { incompatible: true }));
  }
  if (discomfortWith.length > 0) {
    lines.push(buildNameListNote("Cohabitation discomfort with", discomfortWith));
  }
  if (mutualLikes.length > 0) {
    lines.push(
      buildNameListNote("Mutual like with", mutualLikes, { positive: true }),
    );
  }
  if (likedBy.length > 0) {
    lines.push(buildNameListNote("Liked by", likedBy, { positive: true }));
  }
  if (likes.length > 0) {
    lines.push(buildNameListNote("Likes", likes, { positive: true }));
  }

  return lines;
}

/** Compatibility notes that matter — requirements, blocks, space pressure, positives. */
export function meaningfulDeltaNotes(
  delta: CandidateDelta,
  candidateName: string,
): DeltaNote[] {
  const lines: DeltaNote[] = [...consolidateSocialNotes(delta.socialNotes, candidateName)];

  if (delta.terrain.startsWith("+")) {
    lines.push({ text: delta.terrain });
  }

  for (const note of delta.feederNotes) {
    lines.push(note);
  }

  if (isSpaceWarning(delta.space)) {
    lines.push({ text: delta.space });
  }

  return lines;
}
