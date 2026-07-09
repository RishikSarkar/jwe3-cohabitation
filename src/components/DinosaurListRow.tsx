"use client";

import type { EnclosureMember, ScoredCandidate } from "@/types/dinosaur";
import { meaningfulDeltaNotes } from "@/lib/delta-notes";
import {
  isInteractiveRowTarget,
  jwe3DinosaurUrl,
  openJwe3Dinosaur,
} from "@/lib/jwe3-url";
import { FaMars, FaVenus } from "react-icons/fa6";
import { CompatibilityTooltip } from "./CompatibilityTooltip";
import { DinoImage } from "./DinoImage";

const tierClass: Record<string, string> = {
  Excellent: "tier-excellent",
  Good: "tier-good",
  Risky: "tier-risky",
  Poor: "tier-poor",
  Blocked: "tier-blocked",
};

const scoreTierClass: Record<string, string> = {
  Excellent: "tier-score-excellent",
  Good: "tier-score-good",
  Risky: "tier-score-risky",
  Poor: "tier-score-poor",
  Blocked: "tier-score-blocked",
};

function SexCountIcon({ sex }: { sex: "m" | "f" }) {
  const Icon = sex === "m" ? FaMars : FaVenus;
  return (
    <Icon
      className="size-4 shrink-0 text-jwe-offwhite/70"
      aria-hidden
    />
  );
}

function CountField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const clamp = (n: number) => Math.min(99, Math.max(0, n));

  return (
    <div className="count-field" role="group" aria-label={label}>
      <button
        type="button"
        className="count-step"
        aria-label={`Decrease ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value - 1));
        }}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        min={0}
        max={99}
        value={value}
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || 0))}
        className="count-input"
      />
      <button
        type="button"
        className="count-step"
        aria-label={`Increase ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onChange(clamp(value + 1));
        }}
      >
        +
      </button>
    </div>
  );
}

type Props = {
  row: ScoredCandidate;
  mode?: "candidate" | "member";
  member?: EnclosureMember;
  onAdd?: () => void;
  onRemove?: () => void;
  onUpdateMember?: (patch: Partial<EnclosureMember>) => void;
  showAdd?: boolean;
  /** What to show in the candidate column (list rows only). */
  candidateMetrics?: "none" | "appeal-only" | "full";
  /** Land / Aviary / Lagoon — for compatibility score tooltip. */
  enclosureType?: ScoredCandidate["dinosaur"]["enclosureType"];
};

export function DinosaurListRow({
  row,
  mode = "candidate",
  member,
  onAdd,
  onRemove,
  onUpdateMember,
  showAdd,
  candidateMetrics = "none",
  enclosureType,
}: Props) {
  const { dinosaur, score, tier, delta, blocked, breakdown } = row;
  const isMember = mode === "member";
  const showCompatibility =
    candidateMetrics === "full";
  const showAppeal =
    candidateMetrics === "full" || candidateMetrics === "appeal-only";
  const notes = meaningfulDeltaNotes(delta, dinosaur.name);
  const officialUrl = jwe3DinosaurUrl(dinosaur.id);

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
      className={`group dino-row ${!isMember && blocked ? "opacity-55" : ""}`}
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

      <div className="min-w-0 flex-1 dino-row-content">
        <div className="dino-row-primary">
          <h3 className="dino-row-name font-display text-xl font-bold uppercase tracking-wide text-jwe-offwhite sm:text-2xl">
            {dinosaur.name}
          </h3>

          {!isMember && showCompatibility && notes.length > 0 && (
            <ul className="dino-delta">
              {notes.map((line) => (
                <li
                  key={line.text}
                  data-positive={line.positive ? "true" : undefined}
                  data-blocked={line.blocked ? "true" : undefined}
                >
                  {line.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dino-row-actions">
          {isMember && member ? (
            <div className="dino-row-metrics">
              <div className="member-sex-controls">
                <label className="member-sex-row" aria-label="Males">
                  <SexCountIcon sex="m" />
                  <CountField
                    id={`${dinosaur.id}-males`}
                    label="Male count"
                    value={member.males}
                    onChange={(males) => onUpdateMember?.({ males })}
                  />
                </label>
                <label className="member-sex-row" aria-label="Females">
                  <SexCountIcon sex="f" />
                  <CountField
                    id={`${dinosaur.id}-females`}
                    label="Female count"
                    value={member.females}
                    onChange={(females) => onUpdateMember?.({ females })}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={onRemove}
                className="btn-jwe-danger"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="dino-row-metrics">
              {(showCompatibility || showAppeal) && (
                <div className="dino-row-stats">
                  {showCompatibility && (
                    <CompatibilityTooltip
                      score={score}
                      tier={tier}
                      scoreClassName={
                        scoreTierClass[tier] ?? "tier-score-excellent"
                      }
                      tierClassName={tierClass[tier] ?? ""}
                      breakdown={breakdown}
                      enclosureType={enclosureType ?? dinosaur.enclosureType}
                    />
                  )}
                  {showAppeal && (
                    <p
                      className={
                        showCompatibility
                          ? "dino-row-appeal-line"
                          : "dino-row-appeal-primary"
                      }
                    >
                      {showCompatibility ? (
                        <>
                          appeal{" "}
                          {dinosaur.appeal?.toLocaleString() ?? "—"}
                        </>
                      ) : (
                        <>
                          <span className="dino-row-appeal-value">
                            {dinosaur.appeal?.toLocaleString() ?? "—"}
                          </span>
                          <span className="dino-row-appeal-label">
                            base appeal
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}
              {showAdd && onAdd && (
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
