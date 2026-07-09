"use client";

import type { EnclosureRating } from "@/lib/enclosure-rating";
import { EnclosureRatingTooltip } from "./EnclosureRatingTooltip";

type Props = {
  rating: EnclosureRating | null;
};

function EmptyStat({
  value = "—",
  label,
  align = "start",
}: {
  value?: string;
  label: string;
  align?: "start" | "center" | "end";
}) {
  const alignClass =
    align === "center"
      ? "enclosure-stat-center"
      : align === "end"
        ? "enclosure-stat-end"
        : "";

  return (
    <div
      className={`enclosure-stat-group enclosure-stat-stack ${alignClass}`.trim()}
    >
      <span className="enclosure-stat-value enclosure-stat-empty">{value}</span>
      <span className="enclosure-stat-label">{label}</span>
    </div>
  );
}

export function EnclosureRatingBadge({ rating }: Props) {
  if (!rating) {
    return (
      <div
        className="enclosure-stats-bar enclosure-stats-bar-empty"
        aria-label="Empty enclosure"
      >
        <div className="enclosure-stat-group enclosure-stat-rating">
          <div
            className="enclosure-rating-bar enclosure-rating-bar-empty"
            aria-hidden
          />
          <div className="enclosure-stat-copy">
            <div className="enclosure-stat-score-slot">
              <span aria-hidden className="enclosure-stat-rating-width">
                100 Incompatible
              </span>
              <span className="enclosure-stat-value enclosure-stat-score enclosure-stat-empty">
                —
              </span>
            </div>
            <span className="enclosure-stat-label">Compatibility</span>
          </div>
        </div>

        <div className="enclosure-stat-cluster">
          <div className="enclosure-stat-pair enclosure-stat-pair-end">
            <span className="enclosure-stat-value enclosure-stat-empty">—</span>
            <span className="enclosure-stat-label">animals</span>
          </div>
          <span className="enclosure-stat-divider" aria-hidden />
          <div className="enclosure-stat-pair enclosure-stat-pair-start">
            <span className="enclosure-stat-value enclosure-stat-empty">—</span>
            <span className="enclosure-stat-label">species</span>
          </div>
        </div>

        <EmptyStat label="territory" align="center" />
        <EmptyStat label="base appeal" align="end" />
      </div>
    );
  }

  const ringColor =
    rating.tier === "Excellent"
      ? "rgb(var(--brand))"
      : rating.tier === "Good"
        ? "rgb(var(--sky))"
        : rating.tier === "Risky"
          ? "rgb(var(--amber))"
          : "rgb(var(--red))";

  return (
    <div
      className="enclosure-stats-bar"
      aria-label={`Enclosure rating ${rating.score}, ${rating.tier}`}
    >
      <div className="enclosure-stat-group enclosure-stat-rating">
        <div
          className="enclosure-rating-bar"
          style={
            {
              "--rating-pct": `${rating.score}%`,
              "--rating-color": ringColor,
            } as React.CSSProperties
          }
          aria-hidden
        />
        <div className="enclosure-stat-copy">
          <div className="enclosure-stat-score-slot">
            <span aria-hidden className="enclosure-stat-rating-width">
              100 Incompatible
            </span>
            <EnclosureRatingTooltip rating={rating} />
          </div>
          <span className="enclosure-stat-label">Compatibility</span>
        </div>
      </div>

      <div className="enclosure-stat-cluster">
        <div className="enclosure-stat-pair enclosure-stat-pair-end">
          <span className="enclosure-stat-value">{rating.headcount}</span>
          <span className="enclosure-stat-label">
            {rating.headcount === 1 ? "animal" : "animals"}
          </span>
        </div>
        <span className="enclosure-stat-divider" aria-hidden />
        <div className="enclosure-stat-pair enclosure-stat-pair-start">
          <span className="enclosure-stat-value">{rating.speciesCount}</span>
          <span className="enclosure-stat-label">
            {rating.speciesCount === 1 ? "species" : "species"}
          </span>
        </div>
      </div>

      <div className="enclosure-stat-group enclosure-stat-stack enclosure-stat-center">
        <span className="enclosure-stat-value">
          {rating.areaNeed?.value ?? "—"}
        </span>
        <span className="enclosure-stat-label">
          {rating.areaNeed?.label ?? "territory"}
        </span>
      </div>

      <div className="enclosure-stat-group enclosure-stat-stack enclosure-stat-end">
        <span className="enclosure-stat-value">
          {rating.baseAppeal > 0 ? rating.baseAppeal.toLocaleString() : "—"}
        </span>
        <span className="enclosure-stat-label">base appeal</span>
      </div>
    </div>
  );
}
