"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dinosaursData from "@/data/dinosaurs.json";
import { EnclosureBox } from "@/components/EnclosureBox";
import { DinosaurListRow } from "@/components/DinosaurListRow";
import { SortSelect } from "@/components/SortSelect";
import { TerrainMixPanel } from "@/components/TerrainMixPanel";
import { buildEnclosureProfile } from "@/lib/enclosure";
import { scoreAllDinosaurs, sortScoredRows } from "@/lib/score-candidate";
import {
  enclosureStatesEqual,
  enclosureToUrl,
  paramsToEnclosure,
  sanitizeEnclosureState,
} from "@/lib/url-state";
import type { Dinosaur, EnclosureState, SortMode } from "@/types/dinosaur";

const allDinos = dinosaursData as Dinosaur[];

function sortLabelFor(mode: SortMode, hasEnclosure: boolean): string {
  if (mode === "name") return "name";
  if (mode === "appeal") return "appeal";
  if (!hasEnclosure && mode === "recommended") return "appeal";
  if (mode === "recommended") return "recommended";
  if (mode === "compatibility" && hasEnclosure) return "compatibility";
  return hasEnclosure ? "compatibility" : "name";
}

export function EnclosureOptimizer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listSearch, setListSearch] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("compatibility");

  const rawState = useMemo(
    () => paramsToEnclosure(searchParams),
    [searchParams],
  );

  const state = useMemo(
    () => sanitizeEnclosureState(rawState, allDinos),
    [rawState],
  );

  useEffect(() => {
    if (!enclosureStatesEqual(rawState, state)) {
      router.replace(enclosureToUrl(state), { scroll: false });
    }
  }, [rawState, state, router]);

  const onChange = useCallback(
    (next: EnclosureState) => {
      router.replace(enclosureToUrl(sanitizeEnclosureState(next, allDinos)), {
        scroll: false,
      });
    },
    [router],
  );

  const profile = useMemo(
    () => buildEnclosureProfile(state, allDinos),
    [state],
  );

  const hasEnclosure = (profile?.members.length ?? 0) > 0;

  const allScored = useMemo(
    () =>
      scoreAllDinosaurs(state, allDinos, {
        showBlocked,
        searchQuery: listSearch,
      }),
    [state, showBlocked, listSearch],
  );

  const memberRows = useMemo(
    () => allScored.filter((r) => r.inEnclosure),
    [allScored],
  );

  const rows = useMemo(() => {
    const candidates = allScored.filter((r) => !r.inEnclosure);
    return sortScoredRows(candidates, sortMode, hasEnclosure);
  }, [allScored, sortMode, hasEnclosure]);

  const sortLabel = sortLabelFor(sortMode, hasEnclosure);

  function addFromList(dinoId: string) {
    if (state.members.some((m) => m.dinosaurId === dinoId)) return;
    onChange({
      ...state,
      members: [
        ...state.members,
        { dinosaurId: dinoId, males: 0, females: 1 },
      ],
    });
  }

  const terrainAside = profile ? (
    <div className="panel p-6 sm:p-8">
      <TerrainMixPanel profile={profile} />
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-10 text-center lg:mb-12">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-jwe-brand/70">
          Jurassic World Evolution 3
        </p>
        <h1 className="title-jwe mt-4 text-3xl md:text-4xl">
          <span>Enclosure Optimizer</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-jwe-offwhite/60">
          Stock your enclosure, then browse candidates ranked by how little you
          would need to change terrain or feeders to add each one.
        </p>
      </header>

      <div className="space-y-8">
        <EnclosureBox
          state={state}
          allDinos={allDinos}
          memberRows={memberRows}
          onChange={onChange}
        />

        {terrainAside}

        <section className="panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-jwe-brand/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="title-jwe text-left text-xl sm:text-2xl">
                <span>All {state.type} species</span>
              </h2>
              <p className="mt-2 text-sm text-jwe-offwhite/50">
                {rows.length} species · sorted by {sortLabel}
              </p>
            </div>
            <SortSelect value={sortMode} onChange={setSortMode} />
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="text"
              placeholder="Filter by name or family group…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="input-jwe min-w-0 flex-1"
              aria-label="Filter species list"
            />
            <label className="flex shrink-0 cursor-pointer select-none items-center gap-2 text-xs font-semibold uppercase tracking-wide text-jwe-offwhite/45">
              <input
                type="checkbox"
                checked={showBlocked}
                onChange={(e) => setShowBlocked(e.target.checked)}
                className="checkbox-jwe"
              />
              Show blocked
            </label>
          </div>

          <div className="species-list">
            {rows.map((row) => (
              <DinosaurListRow
                key={row.dinosaur.id}
                row={row}
                showAdd
                candidateMetrics={
                  hasEnclosure
                    ? "full"
                    : sortMode === "appeal" || sortMode === "recommended"
                      ? "appeal-only"
                      : "none"
                }
                onAdd={() => addFromList(row.dinosaur.id)}
                enclosureType={state.type}
              />
            ))}
            {rows.length === 0 && (
              <p className="py-16 text-center text-base text-jwe-offwhite/50">
                No dinosaurs match your filter.
              </p>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-16 border-t border-jwe-brand/10 pt-6 text-center text-xs text-jwe-offwhite/35 lg:mt-20">
        Unofficial fan tool · Not affiliated with Frontier Developments
      </footer>
    </div>
  );
}
