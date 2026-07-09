import { Suspense } from "react";
import { EnclosureOptimizer } from "@/components/EnclosureOptimizer";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="mb-10 text-center lg:mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-jwe-brand/70">
              Jurassic World Evolution 3
            </p>
            <h1 className="title-jwe mt-4 text-3xl md:text-4xl">
              <span>Enclosure Optimizer</span>
            </h1>
          </header>
          <p className="panel py-16 text-center text-base text-jwe-offwhite/50">
            Loading…
          </p>
        </div>
      }
    >
      <EnclosureOptimizer />
    </Suspense>
  );
}
