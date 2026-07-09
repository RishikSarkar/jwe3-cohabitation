"use client";

import type { EnclosureProfile } from "@/lib/enclosure";
import { HABITAT_LABELS } from "@/constants/canonical";
import type { HabitatKey } from "@/types/dinosaur";

type Props = {
  profile: EnclosureProfile;
};

export function TerrainMixPanel({ profile }: Props) {
  const entries = Object.entries(profile.envelope.compromise)
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  const feeders = Array.from(profile.feedingTypes);

  return (
    <div className="space-y-4 text-base">
      <h3 className="text-sm font-bold uppercase tracking-widest text-jwe-brand/80">
        Target terrain mix
      </h3>
      {entries.length === 0 ? (
        <p className="text-jwe-offwhite/55">
          No habitat data for this enclosure type.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map(([key, value]) => {
            const pct = Math.round(value ?? 0);
            const barWidth = Math.min(100, Math.max(0, value ?? 0));
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-jwe-offwhite/60">
                  {HABITAT_LABELS[key as HabitatKey]}
                </span>
                <div className="terrain-bar-track">
                  <div
                    className="terrain-bar-fill"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-semibold text-jwe-offwhite">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-jwe-offwhite/65">
        <span className="text-jwe-offwhite/45">Feeders:</span>{" "}
        {feeders.join(", ") || "—"}
      </p>
    </div>
  );
}
