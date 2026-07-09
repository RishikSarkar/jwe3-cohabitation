import { describe, expect, it } from "vitest";
import {
  compatibilityTierFromScore,
  scoreTierClassForValue,
  tooltipPanelChrome,
} from "@/lib/tier-score";

describe("tier-score", () => {
  it("maps values to the same bands as overall compatibility", () => {
    expect(compatibilityTierFromScore(80)).toBe("Excellent");
    expect(compatibilityTierFromScore(60)).toBe("Good");
    expect(compatibilityTierFromScore(40)).toBe("Risky");
    expect(compatibilityTierFromScore(20)).toBe("Poor");
    expect(scoreTierClassForValue(38)).toBe("tier-score-poor");
    expect(scoreTierClassForValue(58)).toBe("tier-score-risky");
  });

  it("uses a solid panel background", () => {
    expect(tooltipPanelChrome("Good").backgroundColor).toBe("rgb(10, 34, 47)");
    expect(tooltipPanelChrome("Risky").border).toBeUndefined();
  });
});
