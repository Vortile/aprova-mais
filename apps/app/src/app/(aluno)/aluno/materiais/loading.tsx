import { Skeleton } from "@/components/ui/skeleton";

export default function AlunoMateriaisLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card flex flex-col overflow-hidden"
          >
            {/* Card header */}
            <div className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-7 w-7 rounded shrink-0" />
              </div>
            </div>

            {/* Card content */}
            <div className="px-4 pb-4 space-y-3 flex-1">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>

            {/* Download button */}
            <div className="px-4 py-3 border-t">
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
