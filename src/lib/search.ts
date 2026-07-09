/** Normalize user search input for substring / regex matching. */
export function normalizeSearchQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDinoSearchTarget(name: string, id: string): string {
  return `${name} ${id}`.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

/**
 * Match dinosaur by normalized substring or user-supplied regex.
 * Invalid regex falls back to substring match.
 */
export function matchesDinoSearch(
  query: string,
  name: string,
  id: string,
): boolean {
  const q = query.trim();
  if (!q) return true;

  const target = normalizeDinoSearchTarget(name, id);

  if (q.startsWith("/") && q.lastIndexOf("/") > 0) {
    const last = q.lastIndexOf("/");
    const pattern = q.slice(1, last);
    const flags = q.slice(last + 1) || "i";
    try {
      return new RegExp(pattern, flags).test(name);
    } catch {
      /* fall through */
    }
  }

  return target.includes(normalizeSearchQuery(q));
}
