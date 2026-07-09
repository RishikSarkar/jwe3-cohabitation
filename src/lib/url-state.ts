import type { Dinosaur, EnclosureMember, EnclosureState, EnclosureType } from "@/types/dinosaur";

export function serializeMember(m: EnclosureMember): string {
  return `${m.dinosaurId}:${m.males}m${m.females}f`;
}

export function parseMember(raw: string): EnclosureMember | null {
  const match = raw.match(/^([^:]+):(\d+)m(\d+)f$/);
  if (!match) return null;
  return {
    dinosaurId: match[1],
    males: parseInt(match[2], 10),
    females: parseInt(match[3], 10),
  };
}

export function enclosureToParams(state: EnclosureState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("type", state.type);
  if (state.members.length > 0) {
    params.set("roster", state.members.map(serializeMember).join(","));
  }
  return params;
}

export function paramsToEnclosure(searchParams: URLSearchParams): EnclosureState {
  const type = (searchParams.get("type") ?? "Land") as EnclosureType;
  const rosterRaw = searchParams.get("roster") ?? "";

  const members: EnclosureMember[] = [];
  if (rosterRaw) {
    for (const part of rosterRaw.split(",")) {
      const m = parseMember(part.trim());
      if (m && (m.males > 0 || m.females > 0)) members.push(m);
    }
  }

  return {
    type: ["Land", "Aviary", "Lagoon"].includes(type) ? type : "Land",
    members,
  };
}

/** Drop unknown ids and wrong-enclosure species so shared URLs stay consistent. */
export function sanitizeEnclosureState(
  state: EnclosureState,
  allDinos: Dinosaur[],
): EnclosureState {
  const byId = new Map(allDinos.map((d) => [d.id, d]));
  const members = state.members.filter((m) => {
    const d = byId.get(m.dinosaurId);
    return d != null && d.enclosureType === state.type;
  });
  return { ...state, members };
}

export function enclosureStatesEqual(a: EnclosureState, b: EnclosureState): boolean {
  if (a.type !== b.type || a.members.length !== b.members.length) {
    return false;
  }
  return a.members.every(
    (m, i) =>
      m.dinosaurId === b.members[i]?.dinosaurId &&
      m.males === b.members[i]?.males &&
      m.females === b.members[i]?.females,
  );
}

export function enclosureToUrl(state: EnclosureState, base = "/"): string {
  const params = enclosureToParams(state);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
