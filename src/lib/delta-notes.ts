import type { CandidateDelta } from "@/types/dinosaur";

export type DeltaNote = {
  text: string;
  positive?: boolean;
  blocked?: boolean;
};

function isDislikeNote(note: string): boolean {
  return /\bdislikes?\b/i.test(note) && !/\blikes\b/i.test(note);
}

function isSpaceWarning(space: string): boolean {
  return (
    space.startsWith("May need") ||
    space.startsWith("Tight fit") ||
    space.toLowerCase().includes("larger enclosure")
  );
}

function formatNameList(names: string[]): string {
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
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

function consolidateSocialNotes(
  socialNotes: string[],
  candidateName: string,
): DeltaNote[] {
  const incomingLikes: string[] = [];
  const outgoingLikes: string[] = [];
  const dislikedBy: string[] = [];
  const dislikes: string[] = [];
  const mutualDislikes: string[] = [];

  for (const note of socialNotes) {
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
    lines.push({
      text: `Mutual dislike with ${formatNameList(mutualDislikes)}`,
      blocked: true,
    });
  }
  if (dislikedBy.length > 0) {
    lines.push({
      text: `Disliked by ${formatNameList(dislikedBy)}`,
      blocked: true,
    });
  }
  if (dislikes.length > 0) {
    lines.push({
      text: `Dislikes ${formatNameList(dislikes)}`,
      blocked: true,
    });
  }
  if (mutualLikes.length > 0) {
    lines.push({
      text: `Mutual like with ${formatNameList(mutualLikes)}`,
      positive: true,
    });
  }
  if (likedBy.length > 0) {
    lines.push({
      text: `Liked by ${formatNameList(likedBy)}`,
      positive: true,
    });
  }
  if (likes.length > 0) {
    lines.push({ text: `Likes ${formatNameList(likes)}`, positive: true });
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
