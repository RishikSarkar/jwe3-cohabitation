import {
  HYBRID_CARNIVORE_IDS,
  MEDIUM_CARNIVORE_IDS,
} from "@/constants/canonical";
import { COHAB_SCORE } from "@/constants/scoring";
import type { CohabTag, Dinosaur, HabitatKey } from "@/types/dinosaur";

function isHybridCarnivore(d: Dinosaur): boolean {
  return HYBRID_CARNIVORE_IDS.has(d.id);
}

export type CohabResult = "liked" | "disliked" | "neutral";

function matchesTag(tag: CohabTag, target: Dinosaur): boolean {
  switch (tag.kind) {
    case "species":
      return tag.id === target.id;
    case "family": {
      const fam = target.family;
      const normalized =
        fam === "Ceratops"
          ? "Ceratopsid"
          : fam === "Hadrosaur"
            ? "Hadrosaurid"
            : fam === "Pachy"
              ? "Pachycephalosaurid"
              : fam;
      return (
        tag.id === normalized ||
        tag.id === fam ||
        (tag.id === "Ceratopsid" && fam === "Ceratops") ||
        (tag.id === "Hadrosaurid" && fam === "Hadrosaur") ||
        (tag.id === "Sauropod" && normalized === "Sauropod")
      );
    }
    case "meta":
      if (tag.tag === "Scavenger") {
        return (
          target.threatClass === "Scavenger" ||
          target.feedingType.toLowerCase().includes("scavenger")
        );
      }
      if (tag.tag === "Carnivores") {
        return (
          target.threatClass === "Carnivore" ||
          target.threatClass === "Piscivore" ||
          target.threatClass === "Scavenger"
        );
      }
      if (tag.tag === "LargeCarnivores") {
        return (
          target.size === "Large" &&
          (target.threatClass === "Carnivore" ||
            target.threatClass === "Piscivore")
        );
      }
      if (tag.tag === "MediumCarnivores") {
        return MEDIUM_CARNIVORE_IDS.has(target.id);
      }
      if (tag.tag === "HybridCarnivores") {
        return isHybridCarnivore(target);
      }
      if (tag.tag === "Therizinosaurs") {
        return (
          target.family === "Therizinosaurid" ||
          target.id === "therizinosaurus" ||
          target.name.toLowerCase().includes("therizino")
        );
      }
      return false;
    case "size":
      return tag.size === target.size;
    default:
      return false;
  }
}

function listMatchesAny(tags: CohabTag[], target: Dinosaur): boolean {
  return tags.some((tag) => matchesTag(tag, target));
}

export function resolveCohabitation(
  from: Dinosaur,
  to: Dinosaur,
): CohabResult {
  if (from.id === "indoraptor" && to.id !== "indoraptor") {
    return "disliked";
  }

  if (from.id === "scorpios-rex" && !isHybridCarnivore(to)) {
    return "disliked";
  }

  if (listMatchesAny(from.cohabitation.likes, to)) {
    return "liked";
  }

  if (listMatchesAny(from.cohabitation.dislikes, to)) {
    return "disliked";
  }

  if (from.id === "indominus-rex") {
    return "disliked";
  }

  if (from.id === "therizinosaurus") {
    const isScavengerFriend =
      to.threatClass === "Scavenger" ||
      listMatchesAny(from.cohabitation.likes, to);
    if (!isScavengerFriend && to.threatClass !== "Scavenger") {
      return "disliked";
    }
  }

  if (isUniversalCarnivoreConflict(from, to)) {
    return "disliked";
  }

  return "neutral";
}

function isHerbivore(d: Dinosaur): boolean {
  return d.threatClass === "Herbivore" || d.threatClass === "Omnivore";
}

function isPredator(d: Dinosaur): boolean {
  return (
    d.threatClass === "Carnivore" ||
    d.threatClass === "Piscivore" ||
    (d.threatClass !== "Scavenger" &&
      d.feedingType.toLowerCase().includes("carnivore"))
  );
}

function isUniversalCarnivoreConflict(a: Dinosaur, b: Dinosaur): boolean {
  const aHerb = isHerbivore(a);
  const bHerb = isHerbivore(b);
  const aPred = isPredator(a);
  const bPred = isPredator(b);

  if (aHerb && bPred) {
    const bIsScavengerOnly =
      b.threatClass === "Scavenger" ||
      (b.cohabitation.likes.some(
        (t) => t.kind === "meta" && t.tag === "Scavenger",
      ) &&
        !b.feedingType.toLowerCase().includes("live prey"));
    const aAllowsCarnivore = a.cohabitation.likes.some(
      (t) =>
        t.kind === "meta" &&
        (t.tag === "Scavenger" || t.tag === "Carnivores"),
    );
    if (!aAllowsCarnivore && !bIsScavengerOnly) return true;
  }

  if (bHerb && aPred) {
    const aIsScavengerOnly =
      a.threatClass === "Scavenger" ||
      a.cohabitation.likes.some(
        (t) => t.kind === "meta" && t.tag === "Scavenger",
      );
    const bAllowsCarnivore = b.cohabitation.likes.some(
      (t) =>
        t.kind === "meta" &&
        (t.tag === "Scavenger" || t.tag === "Carnivores"),
    );
    if (!bAllowsCarnivore && !aIsScavengerOnly) return true;
  }

  return false;
}

export function isIncompatiblePair(a: Dinosaur, b: Dinosaur): boolean {
  if (a.enclosureType !== b.enclosureType) return true;
  return (
    resolveCohabitation(a, b) === "disliked" ||
    resolveCohabitation(b, a) === "disliked"
  );
}

/** One-line social incompatibility reason for list UI (per member ↔ candidate pair). */
export function describeCohabIncompatibility(a: Dinosaur, b: Dinosaur): string {
  const aDislikesB = resolveCohabitation(a, b) === "disliked";
  const bDislikesA = resolveCohabitation(b, a) === "disliked";

  if (aDislikesB && bDislikesA) {
    return `${a.name} and ${b.name} dislike each other`;
  }
  if (aDislikesB) {
    return `${a.name} dislikes ${b.name}`;
  }
  if (bDislikesA) {
    return `${b.name} dislikes ${a.name}`;
  }
  return `${a.name} and ${b.name} cannot cohabit`;
}

/** Pairwise cohabitation comfort — starts at 100; dislikes are 0, neutral stacks discomfort. */
export function pairCohabitationScore(
  a: Dinosaur,
  b: Dinosaur,
): { score: number; incompatible: boolean } {
  if (isIncompatiblePair(a, b)) {
    return { score: 0, incompatible: true };
  }

  const aToB = resolveCohabitation(a, b);
  const bToA = resolveCohabitation(b, a);

  let discomfort = 0;
  if (aToB === "neutral") discomfort += COHAB_SCORE.neutralDiscomfort;
  if (bToA === "neutral") discomfort += COHAB_SCORE.neutralDiscomfort;

  return {
    score: Math.max(0, 100 - discomfort),
    incompatible: false,
  };
}

export function getActiveHabitatKeys(
  habitat: Partial<Record<HabitatKey, number>>,
): HabitatKey[] {
  return (Object.keys(habitat) as HabitatKey[]).filter(
    (k) => (habitat[k] ?? 0) > 0,
  );
}
