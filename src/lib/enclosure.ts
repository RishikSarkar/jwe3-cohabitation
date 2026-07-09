import {
  type Dinosaur,
  type EnclosureMember,
  type EnclosureState,
  type HabitatKey,
} from "@/types/dinosaur";
import { computeAreaDemandLoad } from "./area-need";
import { getActiveHabitatKeys } from "./compatibility";
export type HabitatEnvelope = {
  min: Partial<Record<HabitatKey, number>>;
  max: Partial<Record<HabitatKey, number>>;
  activeKeys: HabitatKey[];
  compromise: Partial<Record<HabitatKey, number>>;
};

export type EnclosureProfile = {
  members: Dinosaur[];
  memberCounts: Map<string, number>;
  envelope: HabitatEnvelope;
  feedingTypes: Set<string>;
  spaceLoad: number;
};

function getHeadcount(member: EnclosureMember): number {
  return member.males + member.females;
}

export function computeEnvelope(members: Dinosaur[], counts: number[]): HabitatEnvelope {
  const min: Partial<Record<HabitatKey, number>> = {};
  const max: Partial<Record<HabitatKey, number>> = {};
  const compromise: Partial<Record<HabitatKey, number>> = {};
  const activeKeysSet = new Set<HabitatKey>();
  let totalWeight = 0;

  members.forEach((d, i) => {
    const weight = counts[i] || 1;
    totalWeight += weight;
    for (const k of getActiveHabitatKeys(d.habitat)) {
      activeKeysSet.add(k);
      const v = d.habitat[k] ?? 0;
      min[k] = min[k] === undefined ? v : Math.min(min[k]!, v);
      max[k] = max[k] === undefined ? v : Math.max(max[k]!, v);
      compromise[k] = (compromise[k] ?? 0) + v * weight;
    }
  });

  for (const k of Object.keys(compromise) as HabitatKey[]) {
    compromise[k] = totalWeight > 0 ? compromise[k]! / totalWeight : 0;
  }

  return {
    min,
    max,
    activeKeys: [...activeKeysSet],
    compromise,
  };
}

export function computeSpaceLoad(
  members: Dinosaur[],
  memberRows: EnclosureMember[],
): number {
  const byId = new Map(memberRows.map((m) => [m.dinosaurId, m]));
  return computeAreaDemandLoad(
    members.map((dinosaur) => {
      const row = byId.get(dinosaur.id);
      return {
        dinosaur,
        count: row ? row.males + row.females : 0,
      };
    }),
  );
}
export function buildEnclosureProfile(
  state: EnclosureState,
  allDinos: Dinosaur[],
): EnclosureProfile | null {
  const byId = new Map(allDinos.map((d) => [d.id, d]));
  const members: Dinosaur[] = [];
  const memberCounts = new Map<string, number>();
  const counts: number[] = [];

  for (const m of state.members) {
    const d = byId.get(m.dinosaurId);
    const hc = getHeadcount(m);
    if (!d || d.enclosureType !== state.type || hc === 0) continue;
    members.push(d);
    counts.push(hc);
    memberCounts.set(m.dinosaurId, (memberCounts.get(m.dinosaurId) ?? 0) + hc);
  }

  if (members.length === 0) return null;

  const envelope = computeEnvelope(members, counts);
  const feedingTypes = new Set(members.map((d) => d.feedingType));
  const spaceLoad = computeSpaceLoad(members, state.members);

  return {
    members,
    memberCounts,
    envelope,
    feedingTypes,
    spaceLoad,
  };
}

export function envelopeWidenDelta(
  envelope: HabitatEnvelope,
  candidate: Dinosaur,
): { delta: number; newKeys: HabitatKey[] } {
  const newKeys: HabitatKey[] = [];
  let delta = 0;

  for (const k of getActiveHabitatKeys(candidate.habitat)) {
    const cv = candidate.habitat[k] ?? 0;
    if (!envelope.activeKeys.includes(k)) {
      newKeys.push(k);
      delta += cv;
    } else {
      const currentMax = envelope.max[k] ?? 0;
      if (cv > currentMax) delta += cv - currentMax;
    }
  }

  return { delta, newKeys };
}

export function dietCompatibilityScore(
  feedingTypes: Set<string>,
  candidate: Dinosaur,
  members: Dinosaur[],
): number {
  if (feedingTypes.has(candidate.feedingType)) return 100;

  const isPredator =
    candidate.threatClass === "Carnivore" ||
    candidate.threatClass === "Piscivore";
  const hasHerbivore = members.some(
    (m) => m.threatClass === "Herbivore" || m.threatClass === "Omnivore",
  );

  if (isPredator && hasHerbivore && candidate.threatClass !== "Scavenger") {
    return 0;
  }

  return Math.max(0, 40 - feedingTypes.size * 15);
}
