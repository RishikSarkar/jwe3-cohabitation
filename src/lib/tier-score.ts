import type { CSSProperties } from "react";
import type { CompatibilityTier } from "@/types/dinosaur";

/** Tier bands for numeric subscores (0–100), matching overall compatibility. */
export function compatibilityTierFromScore(score: number): CompatibilityTier {
  if (score <= 0) return "Poor";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Risky";
  return "Poor";
}

export const SCORE_TIER_CLASS: Record<CompatibilityTier, string> = {
  Excellent: "tier-score-excellent",
  Good: "tier-score-good",
  Risky: "tier-score-risky",
  Poor: "tier-score-poor",
  Blocked: "tier-score-blocked",
};

export function scoreTierClassForValue(score: number): string {
  return SCORE_TIER_CLASS[compatibilityTierFromScore(score)];
}

export function scoreTierClassForTier(tier: string): string {
  return SCORE_TIER_CLASS[tier as CompatibilityTier] ?? SCORE_TIER_CLASS.Excellent;
}

const TOOLTIP_BASE_BG = "rgb(10, 34, 47)";

/** Panel chrome — solid base, no tier border. */
export function tooltipPanelChrome(tier: string): CSSProperties {
  void tier;
  return {
    backgroundColor: TOOLTIP_BASE_BG,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
  };
}
