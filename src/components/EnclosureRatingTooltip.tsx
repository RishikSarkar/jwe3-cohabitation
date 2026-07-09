"use client";

import { useId, useRef, useState } from "react";
import type { EnclosureRating } from "@/lib/enclosure-rating";
import { enclosureRatingBreakdownLines } from "@/lib/enclosure-rating-tooltip";
import { scoreTierClassForValue } from "@/lib/tier-score";
import { TooltipPanel, useFloatingTooltip } from "./floating-tooltip";

const tierClass: Record<string, string> = {
  Excellent: "tier-excellent",
  Good: "tier-good",
  Risky: "tier-risky",
  Poor: "tier-poor",
  Incompatible: "tier-incompatible",
};

const scoreTierClass: Record<string, string> = {
  Excellent: "tier-score-excellent",
  Good: "tier-score-good",
  Risky: "tier-score-risky",
  Poor: "tier-score-poor",
  Incompatible: "tier-score-incompatible",
};

type Props = {
  rating: EnclosureRating;
};

function BreakdownList({ rating }: { rating: EnclosureRating }) {
  const lines = enclosureRatingBreakdownLines(
    rating.breakdown,
    rating.speciesCount,
  );

  return (
    <ul className="compat-tooltip-metrics">
      {lines.map((line) => (
        <li key={line.label}>
          <span className="compat-tooltip-metric-label">
            {line.label}
            <span className="compat-tooltip-metric-weight">{line.weightLabel}</span>
          </span>
          <span
            className={`compat-tooltip-metric-value ${scoreTierClassForValue(line.value)}`}
          >
            {line.value}
          </span>
        </li>
      ))}
      {rating.incompatible && (
        <li>
          <span className="compat-tooltip-metric-label">Status</span>
          <span className="compat-tooltip-metric-value tier-score-incompatible">
            Incompatible
          </span>
        </li>
      )}
    </ul>
  );
}

export function EnclosureRatingTooltip({ rating }: Props) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { style: panelStyle, placement } = useFloatingTooltip(
    open,
    triggerRef,
    panelRef,
  );

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <span className="compat-tooltip">
      <button
        ref={triggerRef}
        type="button"
        className="compat-tooltip-trigger enclosure-rating-trigger"
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`Enclosure rating ${rating.score}, ${rating.tier}. Show breakdown.`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <span
          className={`enclosure-stat-value enclosure-stat-score ${scoreTierClass[rating.tier] ?? "tier-score-excellent"}`}
        >
          {rating.score}
        </span>
        <span className={`tier-badge ${tierClass[rating.tier] ?? ""}`}>
          {rating.tier}
        </span>
      </button>
      <TooltipPanel
        id={tooltipId}
        open={open}
        style={panelStyle}
        placement={placement}
        tier={rating.tier}
        panelRef={panelRef}
      >
        <BreakdownList rating={rating} />
      </TooltipPanel>
    </span>
  );
}
