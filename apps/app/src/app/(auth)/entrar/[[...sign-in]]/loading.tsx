import { Skeleton } from "@/components/ui/skeleton";
import { BrandLockup } from "@/components/brand-lockup";

export default function EntrarLoading() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f5f1e8] p-4">
      {/* Back link placeholder */}
      <div className="absolute left-4 top-4 z-10">
        <Skeleton className="h-8 w-28 rounded-md bg-stone-300/60" />
      </div>

      {/* Background layers (same as real page so the transition is seamless) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,241,232,0.18),rgba(245,241,232,0.78)_48%,rgba(245,241,232,0.94)_100%)]"
      />

      {/* Centred content column */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-5">
        {/* Brand lockup – real component so logo/text show immediately */}
        <BrandLockup
          size="lg"
          priority
          className="drop-shadow-[0_8px_30px_rgba(48,78,112,0.08)]"
        />

        {/* Clerk card skeleton */}
        <div className="w-full rounded-2xl border border-black/5 bg-white/90 shadow-xl backdrop-blur-sm px-8 py-8 space-y-5">
          {/* Card heading */}
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-24 bg-stone-200/80" />
            <Skeleton className="h-4 w-52 bg-stone-200/80" />
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-14 bg-stone-200/80" />
            <Skeleton className="h-10 w-full rounded-md bg-stone-200/80" />
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-14 bg-stone-200/80" />
              <Skeleton className="h-4 w-28 bg-stone-200/80" />
            </div>
            <Skeleton className="h-10 w-full rounded-md bg-stone-200/80" />
          </div>

          {/* Submit button */}
          <Skeleton className="h-10 w-full rounded-md bg-stone-300/70" />
        </div>
      </div>
    </main>
  );
}
