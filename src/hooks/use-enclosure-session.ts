"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Dinosaur, EnclosureState, EnclosureType, SortMode } from "@/types/dinosaur";
import {
  DEFAULT_UI,
  applyUrlToMemory,
  defaultSession,
  loadStoredSession,
  mergeUrlType,
  saveStoredSession,
  stateFromMemory,
  updateMemoryForType,
  type EnclosureMemory,
  type UiPreferences,
} from "@/lib/enclosure-storage";
import {
  enclosureStatesEqual,
  enclosureToUrl,
  paramsToEnclosure,
  sanitizeEnclosureState,
} from "@/lib/url-state";

export function useEnclosureSession(allDinos: Dinosaur[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [memory, setMemory] = useState<EnclosureMemory | null>(null);
  const [ui, setUi] = useState<UiPreferences>(DEFAULT_UI);
  const hydrated = useRef(false);
  const skipUrlSync = useRef(false);

  const urlState = useMemo(
    () => paramsToEnclosure(searchParams),
    [searchParams],
  );

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const stored = loadStoredSession() ?? defaultSession();
    const initialParams = new URLSearchParams(window.location.search);
    const initialUrl = paramsToEnclosure(initialParams);
    let enclosures = stored.enclosures;

    if (initialParams.has("roster")) {
      enclosures = applyUrlToMemory(enclosures, initialUrl, true);
    }

    setMemory(enclosures);
    setUi(stored.ui);

    const merged = sanitizeEnclosureState(
      mergeUrlType(enclosures, initialUrl),
      allDinos,
    );
    skipUrlSync.current = true;
    router.replace(enclosureToUrl(merged), { scroll: false });
  }, [allDinos, router]);

  const state = useMemo(() => {
    if (!memory) {
      return sanitizeEnclosureState(urlState, allDinos);
    }
    return sanitizeEnclosureState(mergeUrlType(memory, urlState), allDinos);
  }, [memory, urlState, allDinos]);

  const persist = useCallback(
    (enclosures: EnclosureMemory, nextUi: UiPreferences = ui) => {
      saveStoredSession({ v: 1, enclosures, ui: nextUi });
    },
    [ui],
  );

  const setState = useCallback(
    (next: EnclosureState) => {
      const clean = sanitizeEnclosureState(next, allDinos);
      setMemory((prev) => {
        const enclosures = updateMemoryForType(
          prev ?? defaultSession().enclosures,
          clean,
        );
        persist(enclosures);
        return enclosures;
      });
      skipUrlSync.current = true;
      router.replace(enclosureToUrl(clean), { scroll: false });
    },
    [allDinos, persist, router],
  );

  const switchType = useCallback(
    (type: EnclosureType) => {
      if (type === state.type || !memory) return;
      const saved = updateMemoryForType(memory, state);
      const next = sanitizeEnclosureState(
        stateFromMemory(type, saved),
        allDinos,
      );
      const enclosures = updateMemoryForType(saved, next);
      setMemory(enclosures);
      persist(enclosures);
      skipUrlSync.current = true;
      router.replace(enclosureToUrl(next), { scroll: false });
    },
    [allDinos, memory, persist, router, state],
  );

  const setSortMode = useCallback(
    (sortMode: SortMode) => {
      setUi((prev) => {
        const nextUi = { ...prev, sortMode };
        if (memory) persist(memory, nextUi);
        return nextUi;
      });
    },
    [memory, persist],
  );

  const setShowIncompatible = useCallback(
    (showIncompatible: boolean) => {
      setUi((prev) => {
        const nextUi = { ...prev, showIncompatible };
        if (memory) persist(memory, nextUi);
        return nextUi;
      });
    },
    [memory, persist],
  );

  useEffect(() => {
    if (!memory || skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    if (!enclosureStatesEqual(urlState, state)) {
      router.replace(enclosureToUrl(state), { scroll: false });
    }
  }, [urlState, state, router, memory]);

  return {
    ready: memory != null,
    state,
    setState,
    switchType,
    sortMode: ui.sortMode,
    setSortMode,
    showIncompatible: ui.showIncompatible,
    setShowIncompatible,
  };
}
