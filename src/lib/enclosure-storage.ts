import type {
  EnclosureMember,
  EnclosureState,
  EnclosureType,
  SortMode,
} from "@/types/dinosaur";

const STORAGE_KEY = "jwe3-enclosure-session";
const STORAGE_VERSION = 1;

export type EnclosureSnapshot = {
  members: EnclosureMember[];
};

export type EnclosureMemory = Record<EnclosureType, EnclosureSnapshot>;

export type UiPreferences = {
  sortMode: SortMode;
  showIncompatible: boolean;
};

export type StoredSession = {
  v: number;
  enclosures: EnclosureMemory;
  ui: UiPreferences;
};

const ENCLOSURE_TYPES: EnclosureType[] = ["Land", "Aviary", "Lagoon"];

export const DEFAULT_UI: UiPreferences = {
  sortMode: "compatibility",
  showIncompatible: false,
};

export function emptySnapshot(): EnclosureSnapshot {
  return { members: [] };
}

export function defaultMemory(): EnclosureMemory {
  return {
    Land: emptySnapshot(),
    Aviary: emptySnapshot(),
    Lagoon: emptySnapshot(),
  };
}

export function defaultSession(): StoredSession {
  return {
    v: STORAGE_VERSION,
    enclosures: defaultMemory(),
    ui: { ...DEFAULT_UI },
  };
}

function isEnclosureType(value: string): value is EnclosureType {
  return ENCLOSURE_TYPES.includes(value as EnclosureType);
}

function isSortMode(value: string): value is SortMode {
  return ["compatibility", "recommended", "name", "appeal"].includes(value);
}

function sanitizeMember(raw: unknown): EnclosureMember | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.dinosaurId !== "string") return null;
  const males = Number(m.males);
  const females = Number(m.females);
  if (!Number.isFinite(males) || !Number.isFinite(females)) return null;
  if (males < 0 || females < 0) return null;
  if (males === 0 && females === 0) return null;
  return { dinosaurId: m.dinosaurId, males, females, };
}

function sanitizeSnapshot(raw: unknown): EnclosureSnapshot {
  if (!raw || typeof raw !== "object") return emptySnapshot();
  const snap = raw as Record<string, unknown>;
  const members = Array.isArray(snap.members)
    ? snap.members
        .map(sanitizeMember)
        .filter((m): m is EnclosureMember => m != null)
    : [];
  return { members };
}

export function parseStoredSession(raw: unknown): StoredSession {
  if (!raw || typeof raw !== "object") return defaultSession();
  const data = raw as Record<string, unknown>;
  const enclosures = defaultMemory();
  const encRaw =
    data.enclosures && typeof data.enclosures === "object"
      ? (data.enclosures as Record<string, unknown>)
      : {};

  for (const type of ENCLOSURE_TYPES) {
    enclosures[type] = sanitizeSnapshot(encRaw[type]);
  }

  const uiRaw =
    data.ui && typeof data.ui === "object"
      ? (data.ui as Record<string, unknown>)
      : {};
  const sortMode =
    typeof uiRaw.sortMode === "string" && isSortMode(uiRaw.sortMode)
      ? uiRaw.sortMode
      : DEFAULT_UI.sortMode;
  const showIncompatible =
    typeof uiRaw.showIncompatible === "boolean"
      ? uiRaw.showIncompatible
      : typeof uiRaw.showBlocked === "boolean"
        ? uiRaw.showBlocked
        : DEFAULT_UI.showIncompatible;

  return {
    v: STORAGE_VERSION,
    enclosures,
    ui: { sortMode, showIncompatible },
  };
}

export function loadStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseStoredSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, v: STORAGE_VERSION }),
    );
  } catch {
    // Quota exceeded or private mode — ignore.
  }
}

export function snapshotFromState(state: EnclosureState): EnclosureSnapshot {
  return { members: state.members };
}

export function stateFromMemory(
  type: EnclosureType,
  memory: EnclosureMemory,
): EnclosureState {
  const snap = memory[type] ?? emptySnapshot();
  return { type, members: [...snap.members] };
}

export function applyUrlToMemory(
  memory: EnclosureMemory,
  urlState: EnclosureState,
  hasRosterParam: boolean,
): EnclosureMemory {
  const next = { ...memory };
  if (hasRosterParam || urlState.members.length > 0) {
    next[urlState.type] = snapshotFromState(urlState);
  }
  return next;
}

export function mergeUrlType(
  memory: EnclosureMemory,
  urlState: EnclosureState,
): EnclosureState {
  const type = isEnclosureType(urlState.type) ? urlState.type : "Land";
  const snap = memory[type] ?? emptySnapshot();
  return { type, members: [...snap.members] };
}

export function updateMemoryForType(
  memory: EnclosureMemory,
  state: EnclosureState,
): EnclosureMemory {
  return {
    ...memory,
    [state.type]: snapshotFromState(state),
  };
}
