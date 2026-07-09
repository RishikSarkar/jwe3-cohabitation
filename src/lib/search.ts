/** Normalize user search input for substring / regex matching. */
export function normalizeSearchQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactQuery(raw: string): string {
  return normalizeSearchQuery(raw).replace(/\s/g, "");
}

export type DinoSearchFields = {
  name: string;
  id: string;
  family?: string;
  threatClass?: string;
  enclosureType?: string;
};

export function normalizeDinoSearchTarget({
  name,
  id,
  family = "",
  threatClass = "",
  enclosureType = "",
}: DinoSearchFields): string {
  return `${name} ${id} ${family} ${threatClass} ${enclosureType}`
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

/**
 * Query shorthand → dinosaur `family` values (guide / spreadsheet groups).
 */
const FAMILY_QUERY_GROUPS: Record<string, readonly string[]> = {
  ankylosaurid: ["Ankylosaurid"],
  ankylosaur: ["Ankylosaurid"],
  anky: ["Ankylosaurid"],
  ankys: ["Ankylosaurid"],

  carnivore: ["Carnivore"],
  carnivores: ["Carnivore"],

  ceratopsid: ["Ceratopsid", "Ceratops", "Hybrid Ceratops"],
  ceratops: ["Ceratopsid", "Ceratops", "Hybrid Ceratops"],

  hadrosaurid: ["Hadrosaurid", "Hadrosaur"],
  hadrosaur: ["Hadrosaurid", "Hadrosaur"],
  hadrosaurs: ["Hadrosaurid", "Hadrosaur"],

  ornithomimosaurid: ["Ornithomimosaurid", "Deinocheirus"],
  ornithomimid: ["Ornithomimosaurid", "Deinocheirus"],
  ornithomimids: ["Ornithomimosaurid", "Deinocheirus"],

  pachycephalosaurid: ["Pachycephalosaurid"],
  pachycephalosaur: ["Pachycephalosaurid"],
  pachy: ["Pachycephalosaurid"],
  pachys: ["Pachycephalosaurid"],

  sauropod: ["Sauropod", "Hybrid Sauropod"],
  sauropods: ["Sauropod", "Hybrid Sauropod"],

  stegosaurid: ["Stegosaurid"],
  stegosaur: ["Stegosaurid"],
  stego: ["Stegosaurid"],
  stegos: ["Stegosaurid"],

  scavenger: ["Scavenger"],
  scavengers: ["Scavenger"],

  therizinosaurid: ["Therizinosaurid"],
  therizino: ["Therizinosaurid"],
  therizinosaurus: ["Therizinosaurid"],

  therapsid: ["Therapsid"],

  dimetrodon: ["Dimetrodon"],
  deinocheirus: ["Deinocheirus"],

  hybrid: ["Hybrid", "Hybrid Carnivore", "Hybrid Ceratops", "Hybrid Sauropod"],
  hybridcarnivore: ["Hybrid Carnivore"],
  hybridcarnivores: ["Hybrid Carnivore"],
  hybridceratops: ["Hybrid Ceratops"],
  hybridsauropod: ["Hybrid Sauropod"],
};

/** Enclosure / diet group shorthands when `family` is not set (aviary, lagoon). */
const ENCLOSURE_TYPE_QUERY: Record<string, string> = {
  land: "Land",
  aviary: "Aviary",
  lagoon: "Lagoon",
};

const THREAT_CLASS_QUERY: Record<string, string> = {
  marine: "Marine",
  piscivore: "Piscivore",
  herbivore: "Herbivore",
  omnivore: "Omnivore",
};

function familiesForQuery(query: string): readonly string[] | null {
  const compact = compactQuery(query);
  if (!compact) return null;
  return FAMILY_QUERY_GROUPS[compact] ?? null;
}

function matchesFamilyGroup(family: string, query: string): boolean {
  const group = familiesForQuery(query);
  if (!group) return false;
  return group.includes(family);
}

function matchesFamilySubstring(family: string, query: string): boolean {
  const normFamily = normalizeSearchQuery(family);
  const normQuery = normalizeSearchQuery(query);
  if (!normQuery || !normFamily) return false;
  return normFamily.includes(normQuery);
}

function matchesEnclosureOrThreatGroup(
  query: string,
  threatClass?: string,
  enclosureType?: string,
): boolean {
  const compact = compactQuery(query);
  const enc = ENCLOSURE_TYPE_QUERY[compact];
  if (enc && enclosureType === enc) return true;

  const threat = THREAT_CLASS_QUERY[compact];
  if (threat && threatClass === threat) return true;

  return false;
}

/**
 * Match dinosaur by name, id, family group, or user-supplied regex.
 * Invalid regex falls back to substring match.
 */
export function matchesDinoSearch(
  query: string,
  fields: DinoSearchFields,
): boolean {
  const q = query.trim();
  if (!q) return true;

  const { id, family = "", threatClass, enclosureType } = fields;

  if (q.startsWith("/") && q.lastIndexOf("/") > 0) {
    const last = q.lastIndexOf("/");
    const pattern = q.slice(1, last);
    const flags = q.slice(last + 1) || "i";
    try {
      const re = new RegExp(pattern, flags);
      const { name, id, family = "", threatClass = "", enclosureType = "" } =
        fields;
      return (
        re.test(name) ||
        re.test(id) ||
        re.test(family) ||
        re.test(threatClass) ||
        re.test(enclosureType) ||
        re.test(normalizeDinoSearchTarget(fields))
      );
    } catch {
      /* fall through */
    }
  }

  const target = normalizeDinoSearchTarget(fields);
  if (target.includes(normalizeSearchQuery(q))) {
    return true;
  }

  if (family && matchesFamilyGroup(family, q)) {
    return true;
  }

  if (family && matchesFamilySubstring(family, q)) {
    return true;
  }

  if (matchesEnclosureOrThreatGroup(q, threatClass, enclosureType)) {
    return true;
  }

  // Also match id slug fragments (e.g. "utah" → utahraptor).
  if (id.toLowerCase().includes(compactQuery(q))) {
    return true;
  }

  return false;
}
