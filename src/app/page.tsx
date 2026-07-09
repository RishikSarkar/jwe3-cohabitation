import { Suspense } from "react";
import { EnclosureOptimizer } from "@/components/EnclosureOptimizer";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-400">
          Loading enclosure data…
        </div>
      }
    >
      <EnclosureOptimizer />
    </Suspense>
  );
}
