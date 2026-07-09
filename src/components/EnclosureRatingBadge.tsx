"use client";

import type { EnclosureRating } from "@/lib/enclosure-rating";

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
      className="enclosure-rating"
      aria-label={`Enclosure rating ${rating.score}, ${rating.tier}`}
      title={ratingSummary(rating)}
    >
      <div
        className="enclosure-rating-ring"
        style={
          {
            "--rating-deg": `${rating.score * 3.6}deg`,
            "--rating-color": ringColor,
          } as React.CSSProperties
        }
      >
        <span
          className={`enclosure-rating-value ${scoreColor[rating.tier] ?? "text-jwe-brand"}`}
        >
          {rating.score}
        </span>
      </div>
      <p className="enclosure-rating-line">
        <span className={`tier-badge ${tierClass[rating.tier] ?? ""}`}>
          {rating.tier}
        </span>
        <span className="enclosure-rating-count">
          {rating.headcount} {rating.headcount === 1 ? "animal" : "animals"} ·{" "}
          {rating.speciesCount}{" "}
          {rating.speciesCount === 1 ? "species" : "species"}
        </span>
      </p>
    </div>
  );
}
