"use client";

import type { EnclosureMember, ScoredCandidate } from "@/types/dinosaur";
import { meaningfulDeltaNotes } from "@/lib/delta-notes";
import {
  isInteractiveRowTarget,
  jwe3DinosaurUrl,
  openJwe3Dinosaur,
} from "@/lib/jwe3-url";
import { DinoImage } from "./DinoImage";

const tierClass: Record<string, string> = {
  Excellent: "tier-excellent",
  Good: "tier-good",
  Risky: "tier-risky",
  Poor: "tier-poor",
  Blocked: "tier-blocked",
};

const scoreColor: Record<string, string> = {
  Excellent: "text-jwe-brand",
  Good: "text-sky-400",
  Risky: "text-jwe-amber",
  Poor: "text-red-400",
  Blocked: "text-red-400",
};

type Props = {
  row: ScoredCandidate;
  mode?: "candidate" | "member";
  member?: EnclosureMember;
  onAdd?: () => void;
  onRemove?: () => void;
  onUpdateMember?: (patch: Partial<EnclosureMember>) => void;
  showAdd?: boolean;
  showCompatibility?: boolean;
};

export function DinosaurListRow({
  row,
  mode = "candidate",
  member,
  onAdd,
  onRemove,
  onUpdateMember,
  showAdd,
  showCompatibility = true,
}: Props) {
  const { dinosaur, score, tier, delta, blocked } = row;
  const isMember = mode === "member";
  const notes = meaningfulDeltaNotes(delta);
  const officialUrl = jwe3DinosaurUrl(dinosaur.id);
  const hasDetailBelow =
    !isMember && showCompatibility && notes.length > 0;

  function handleRowClick(e: React.MouseEvent<HTMLElement>) {
    if (isInteractiveRowTarget(e.target)) return;
    openJwe3Dinosaur(dinosaur.id);
  }

  function handleRowKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== "Enter" || isInteractiveRowTarget(e.target)) return;
    openJwe3Dinosaur(dinosaur.id);
  }

  return (
    <article
      className={`group dino-row ${hasDetailBelow ? "dino-row-detailed" : ""} ${!isMember && blocked ? "opacity-55" : ""}`}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`${dinosaur.name} on Jurassic World Evolution 3`}
      title={`View ${dinosaur.name} on jurassicworldevolution.com`}
    >
      <DinoImage
        src={dinosaur.image}
        video={dinosaur.video}
        name={dinosaur.name}
        variant="row"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="dino-row-name font-display text-xl font-bold uppercase tracking-wide text-jwe-offwhite sm:text-2xl">
            {dinosaur.name}
          </h3>

          {isMember && member ? (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-jwe-offwhite/70">
                M
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={member.males}
                  onChange={(e) =>
                    onUpdateMember?.({
                      males: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="count-input"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-jwe-offwhite/70">
                F
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={member.females}
                  onChange={(e) =>
                    onUpdateMember?.({
                      females: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="count-input"
                />
              </label>
              <button
                type="button"
                onClick={onRemove}
                className="btn-jwe-danger"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {showCompatibility && (
                <>
                  <span
                    className={`font-display text-3xl font-bold ${scoreColor[tier] ?? "text-jwe-brand"}`}
                  >
                    {score ?? "—"}
                  </span>
                  <span className={`tier-badge ${tierClass[tier] ?? ""}`}>
                    {tier}
                  </span>
                </>
              )}
              {showAdd && onAdd && !blocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  className="btn-jwe"
                >
                  Add
                </button>
              )}
            </div>
          )}
        </div>

        {!isMember && showCompatibility && notes.length > 0 && (
          <ul className="dino-delta">
            {notes.map((line) => (
              <li
                key={line.text}
                data-positive={line.positive ? "true" : undefined}
              >
                {line.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        href={officialUrl}
        className="sr-only"
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
      >
        Official JWE3 page
      </a>
    </article>
  );
}
