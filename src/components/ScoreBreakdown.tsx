"use client";

type Props = {
  breakdown: {
    habitatCosine: number;
    sharedKeyCoverage: number;
    envelopeTightness: number;
    dietCompatibility: number;
    cohabitation: number;
    spaceHeadroom: number;
  };
};

const LABELS: Record<keyof Props["breakdown"], string> = {
  habitatCosine: "Habitat cosine",
  sharedKeyCoverage: "Shared terrain",
  envelopeTightness: "Envelope",
  dietCompatibility: "Diet",
  cohabitation: "Social",
  spaceHeadroom: "Space",
};

export function ScoreBreakdown({ breakdown }: Props) {
  const items = (
    Object.entries(breakdown) as [keyof Props["breakdown"], number][]
  ).map(([key, value]) => ({ label: LABELS[key], value }));

  return (
    <details className="group mt-3 text-sm">
      <summary className="cursor-pointer text-jwe-offwhite/45 hover:text-jwe-brand">
        Score breakdown
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-jwe-offwhite/45">{label}</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-black/40">
              <div
                className="h-full bg-jwe-brand/60"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="w-8 text-right text-jwe-offwhite/55">{value}</span>
          </div>
        ))}
      </div>
    </details>
  );
}
