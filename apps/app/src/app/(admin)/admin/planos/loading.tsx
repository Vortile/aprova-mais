import { Skeleton } from "@/components/ui/skeleton";

export default function PlanosLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Toolbar: count + button */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Card grid – 3 columns on xl */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 flex flex-col gap-4"
          >
            {/* Plan name + price */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24 mt-1" />
            </div>

            {/* Feature list */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex gap-2 items-center">
                  <Skeleton className="h-3 w-3 rounded-sm shrink-0" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>

            {/* Footer: badge + action buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <Skeleton className="h-5 w-14 rounded-full" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
