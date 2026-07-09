import { HABITAT_KEYS } from "@/constants/canonical";
import type { HabitatKey } from "@/types/dinosaur";

export type HabitatVector = Record<HabitatKey, number>;

export function emptyHabitatVector(): HabitatVector {
  return Object.fromEntries(
    HABITAT_KEYS.map((k) => [k, 0]),
  ) as HabitatVector;
}

/** L2-normalized habitat vector for cosine similarity. */
export function habitatToVector(
  habitat: Partial<Record<HabitatKey, number>>,
): HabitatVector {
  const vec = emptyHabitatVector();
  let sumSq = 0;
  for (const k of HABITAT_KEYS) {
    const v = habitat[k] ?? 0;
    vec[k] = v;
    sumSq += v * v;
  }
  if (sumSq === 0) return vec;
  const norm = Math.sqrt(sumSq);
  for (const k of HABITAT_KEYS) {
    vec[k] /= norm;
  }
  return vec;
}

/** Cosine similarity in [0, 1]. Returns 0 if either vector is zero. */
export function cosineSimilarity(a: HabitatVector, b: HabitatVector): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const k of HABITAT_KEYS) {
    dot += a[k] * b[k];
    magA += a[k] * a[k];
    magB += b[k] * b[k];
  }
  if (magA === 0 || magB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(magA) * Math.sqrt(magB))));
}

/** Fraction of candidate's habitat mass on keys already used by the enclosure. */
export function sharedKeyCoverage(
  activeKeys: HabitatKey[],
  candidate: Partial<Record<HabitatKey, number>>,
): number {
  const keys = HABITAT_KEYS.filter((k) => (candidate[k] ?? 0) > 0);
  if (keys.length === 0) return 1;
  let onActive = 0;
  let total = 0;
  for (const k of keys) {
    const v = candidate[k] ?? 0;
    total += v;
    if (activeKeys.includes(k)) onActive += v;
  }
  return total > 0 ? onActive / total : 1;
}
