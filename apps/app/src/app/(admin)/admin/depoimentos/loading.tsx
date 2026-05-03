import { Skeleton } from "@/components/ui/skeleton";

export default function DepoimentosLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Toolbar: count + button */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* 3-column card grid – max 3 depoimentos */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 flex flex-col gap-4"
          >
            {/* Quote icon + badge row */}
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {/* Quote text – 4 lines */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Author name */}
            <Skeleton className="h-4 w-32" />

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-9 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
