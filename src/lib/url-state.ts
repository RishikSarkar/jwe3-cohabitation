import type { EnclosureMember, EnclosureSize, EnclosureState, EnclosureType } from "@/types/dinosaur";

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
  params.set("size", state.size);
  if (state.members.length > 0) {
    params.set("roster", state.members.map(serializeMember).join(","));
  }
  return params;
}

export function paramsToEnclosure(searchParams: URLSearchParams): EnclosureState {
  const type = (searchParams.get("type") ?? "Land") as EnclosureType;
  const size = (searchParams.get("size") ?? "Standard") as EnclosureSize;
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
    size: ["Compact", "Standard", "Spacious"].includes(size)
      ? size
      : "Standard",
    members,
  };
}

export function enclosureToUrl(state: EnclosureState, base = "/"): string {
  const params = enclosureToParams(state);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
