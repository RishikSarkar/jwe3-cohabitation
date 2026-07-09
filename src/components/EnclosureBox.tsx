"use client";

import { useMemo, useRef, useState } from "react";
import type {
  Dinosaur,
  EnclosureMember,
  EnclosureSize,
  EnclosureState,
  EnclosureType,
  ScoredCandidate,
} from "@/types/dinosaur";
import { matchesDinoSearch } from "@/lib/search";
import { DinoImage } from "./DinoImage";
import { DinosaurListRow } from "./DinosaurListRow";

type Props = {
  state: EnclosureState;
  allDinos: Dinosaur[];
  memberRows: ScoredCandidate[];
  onChange: (state: EnclosureState) => void;
};

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-lg seg-control">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          data-active={value === opt}
          onClick={() => onChange(opt)}
          className="seg-btn"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const DEFAULT_MEMBER: Pick<EnclosureMember, "males" | "females"> = {
  males: 0,
  females: 1,
};

export function EnclosureBox({
  state,
  allDinos,
  memberRows,
  onChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const memberIds = new Set(state.members.map((m) => m.dinosaurId));
    return allDinos
      .filter((d) => d.enclosureType === state.type)
      .filter((d) => !memberIds.has(d.id))
      .filter((d) => matchesDinoSearch(query, d.name, d.id))
      .slice(0, 8);
  }, [allDinos, state.type, state.members, query]);

  function setType(type: EnclosureType) {
    onChange({ ...state, type, members: [] });
  }

  function setSize(size: EnclosureSize) {
    onChange({ ...state, size });
  }

  function addMember(dino: Dinosaur) {
    if (state.members.some((m) => m.dinosaurId === dino.id)) return;
    onChange({
      ...state,
      members: [
        ...state.members,
        { dinosaurId: dino.id, ...DEFAULT_MEMBER },
      ],
    });
    setQuery("");
    setShowPicker(false);
  }

  function removeMember(id: string) {
    onChange({
      ...state,
      members: state.members.filter((m) => m.dinosaurId !== id),
    });
  }

  function updateMember(id: string, patch: Partial<EnclosureMember>) {
    onChange({
      ...state,
      members: state.members.map((m) =>
        m.dinosaurId === id ? { ...m, ...patch } : m,
      ),
    });
  }

  const memberById = useMemo(
    () => new Map(state.members.map((m) => [m.dinosaurId, m])),
    [state.members],
  );

  const rowById = useMemo(
    () => new Map(memberRows.map((r) => [r.dinosaur.id, r])),
    [memberRows],
  );

  const orderedMemberRows = useMemo(
    () =>
      state.members
        .filter(
          (m) =>
            (memberById.get(m.dinosaurId)?.males ?? 0) +
              (memberById.get(m.dinosaurId)?.females ?? 0) >
            0,
        )
        .map((m) => rowById.get(m.dinosaurId))
        .filter((r): r is ScoredCandidate => r != null),
    [state.members, memberById, rowById],
  );

  return (
    <section className="panel panel-enclosure p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="title-jwe text-xl sm:text-2xl">
          <span>Enclosure</span>
        </h2>
        <SegmentedControl
          options={["Land", "Aviary", "Lagoon"] as EnclosureType[]}
          value={state.type}
          onChange={setType}
        />
      </div>

      {orderedMemberRows.length === 0 ? (
        <p className="py-8 text-center text-base text-jwe-offwhite/50">
          Add dinosaurs from the list below, or search here.
        </p>
      ) : (
        <div className="enclosure-members">
          {orderedMemberRows.map((row) => {
            const member = memberById.get(row.dinosaur.id)!;
            return (
              <DinosaurListRow
                key={row.dinosaur.id}
                row={row}
                mode="member"
                member={member}
                onRemove={() => removeMember(row.dinosaur.id)}
                onUpdateMember={(patch) =>
                  updateMember(row.dinosaur.id, patch)
                }
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t border-jwe-brand/10 pt-6 md:flex-row md:items-end">
        <div className="search-picker flex-1" ref={pickerRef}>
          <input
            type="text"
            placeholder="Search to add…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowPicker(true);
            }}
            onFocus={() => setShowPicker(true)}
            onBlur={() => setTimeout(() => setShowPicker(false), 150)}
            className="input-jwe"
          />
          {showPicker && query && (
            <ul className="dropdown-jwe">
              {filtered.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addMember(d)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-jwe-brand/10"
                  >
                    <DinoImage
                      src={d.image}
                      video={d.video}
                      name={d.name}
                      variant="thumb"
                    />
                    <span className="text-base uppercase">{d.name}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-base text-jwe-offwhite/50">
                  No matches
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-widest text-jwe-offwhite/50">
            Size
          </span>
          <SegmentedControl
            options={["Compact", "Standard", "Spacious"] as EnclosureSize[]}
            value={state.size}
            onChange={setSize}
          />
        </div>
      </div>
    </section>
  );
}
