"use client";

import type { EnclosureRating } from "@/lib/enclosure-rating";

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

type Props = {
  rating: EnclosureRating;
};

function ratingSummary(rating: EnclosureRating): string {
  const { breakdown: b } = rating;
  if (b.hasActiveDislike) {
    return "At least one stocked species dislikes another in this enclosure.";
  }
  return `Social ${b.social} (85%), logistics ${b.logistics} (15% terrain/feeders/space). Weakest logistics: ${b.worstMemberName}.`;
}

export function EnclosureRatingBadge({ rating }: Props) {
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
      title={ratingSummary(rating)}
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
          <div className="enclosure-stat-score-row">
            <span
              className={`enclosure-stat-value enclosure-stat-score ${scoreTierClass[rating.tier] ?? "tier-score-excellent"}`}
            >
              {rating.score}
            </span>
            <span className={`tier-badge ${tierClass[rating.tier] ?? ""}`}>
              {rating.tier}
            </span>
          </div>
          <span className="enclosure-stat-label">Compatibility</span>
        </div>
      </div>

      <div className="enclosure-stat-group enclosure-stat-stack">
        <span className="enclosure-stat-value">{rating.headcount}</span>
        <span className="enclosure-stat-label">
          {rating.headcount === 1 ? "animal" : "animals"} · {rating.speciesCount}{" "}
          {rating.speciesCount === 1 ? "species" : "species"}
        </span>
      </div>

      {rating.baseAppeal > 0 && (
        <div className="enclosure-stat-group enclosure-stat-stack enclosure-stat-end">
          <span className="enclosure-stat-value">
            {rating.baseAppeal.toLocaleString()}
          </span>
          <span className="enclosure-stat-label">base appeal</span>
        </div>
      )}
    </div>
  );
}
