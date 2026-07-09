"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dinosaursData from "@/data/dinosaurs.json";
import { EnclosureBox } from "@/components/EnclosureBox";
import { DinosaurListRow } from "@/components/DinosaurListRow";
import { TerrainMixPanel } from "@/components/TerrainMixPanel";
import { buildEnclosureProfile } from "@/lib/enclosure";
import { scoreAllDinosaurs, sortScoredRows } from "@/lib/score-candidate";
import { enclosureToUrl, paramsToEnclosure } from "@/lib/url-state";
import type { Dinosaur, EnclosureState, SortMode } from "@/types/dinosaur";

const allDinos = dinosaursData as Dinosaur[];

export function EnclosureOptimizer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showBlocked, setShowBlocked] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("compatibility");

  const state = useMemo(
    () => paramsToEnclosure(searchParams),
    [searchParams],
  );

  const onChange = useCallback(
    (next: EnclosureState) => {
      router.replace(enclosureToUrl(next), { scroll: false });
    },
    [router],
  );

  const hasEnclosure = state.members.some((m) => m.males + m.females > 0);

  const profile = useMemo(
    () => buildEnclosureProfile(state, allDinos),
    [state],
  );

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

  const sortLabel =
    sortMode === "compatibility" && hasEnclosure ? "compatibility" : "name";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <header className="mb-12 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-jwe-brand/70">
          Jurassic World Evolution 3
        </p>
        <h1 className="title-jwe mt-4 text-3xl md:text-4xl">
          <span>Enclosure Optimizer</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-jwe-offwhite/60">
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

        {profile && (
          <div className="panel p-6 sm:p-8">
            <TerrainMixPanel profile={profile} />
          </div>
        )}

        <section className="panel p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-jwe-brand/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="title-jwe text-xl sm:text-2xl">
                <span>All {state.type} species</span>
              </h2>
              <p className="mt-2 text-sm text-jwe-offwhite/50">
                {rows.length} species · sorted by {sortLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="input-jwe select-jwe w-auto min-w-[200px]"
              >
                <option value="compatibility">Sort: Compatibility</option>
                <option value="name">Sort: Name</option>
              </select>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-jwe-offwhite/60">
                <input
                  type="checkbox"
                  checked={showBlocked}
                  onChange={(e) => setShowBlocked(e.target.checked)}
                  className="checkbox-jwe"
                />
                Show blocked
              </label>
            </div>
          </div>

          <input
            type="text"
            placeholder="Filter list…"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            className="input-jwe mb-5"
          />

          <div className="species-list">
            {rows.map((row) => (
              <DinosaurListRow
                key={row.dinosaur.id}
                row={row}
                showAdd
                showCompatibility={hasEnclosure}
                onAdd={() => addFromList(row.dinosaur.id)}
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

      <footer className="mt-20 border-t border-jwe-brand/10 pt-8 text-center text-sm text-jwe-offwhite/35">
        Fan-made JWE3 tool. Data from community habitat planners. Images from{" "}
        <a
          href="https://www.jurassicworldevolution.com/en-US/3/dinosaurs"
          className="text-jwe-brand/70 hover:text-jwe-brand hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jurassic World Evolution 3
        </a>
        . Not affiliated with Frontier Developments.
      </footer>
    </div>
  );
}
