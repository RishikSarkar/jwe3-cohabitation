import type {
  CohabTag,
  Dinosaur,
  HabitatKey,
  SizeClass,
} from "@/types/dinosaur";

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
          target.cohabitation.likes.some(
            (t) => t.kind === "meta" && t.tag === "Scavenger",
          ) ||
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
  if (listMatchesAny(from.cohabitation.dislikes, to)) {
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

  if (listMatchesAny(from.cohabitation.likes, to)) {
    return "liked";
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

export function isBlockedPair(a: Dinosaur, b: Dinosaur): boolean {
  if (a.enclosureType !== b.enclosureType) return true;
  const ab = resolveCohabitation(a, b);
  const ba = resolveCohabitation(b, a);
  return ab === "disliked" || ba === "disliked";
}

export function cohabitationScore(from: Dinosaur, to: Dinosaur): number {
  const result = resolveCohabitation(from, to);
  if (result === "liked") return 35;
  if (result === "neutral") return -8;
  return -100;
}

export function getActiveHabitatKeys(
  habitat: Partial<Record<HabitatKey, number>>,
): HabitatKey[] {
  return (Object.keys(habitat) as HabitatKey[]).filter(
    (k) => (habitat[k] ?? 0) > 0,
  );
}

export function habitatOverlap(
  a: Partial<Record<HabitatKey, number>>,
  b: Partial<Record<HabitatKey, number>>,
): number {
  const keys = new Set([
    ...getActiveHabitatKeys(a),
    ...getActiveHabitatKeys(b),
  ]);
  let overlap = 0;
  let totalB = 0;
  for (const k of keys) {
    const bv = b[k] ?? 0;
    totalB += bv;
    overlap += Math.min(a[k] ?? 0, bv);
  }
  return totalB > 0 ? overlap / totalB : 0;
}

export function sizeHarmony(a: SizeClass, b: SizeClass): number {
  const order: SizeClass[] = ["Small", "Medium", "Large"];
  const diff = Math.abs(order.indexOf(a) - order.indexOf(b));
  if (diff === 0) return 5;
  if (diff === 1) return 2;
  return -5;
}
