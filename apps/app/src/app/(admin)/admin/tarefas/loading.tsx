import { Skeleton } from "@/components/ui/skeleton";

export default function TarefasAdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-36 mb-3" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Task cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            {/* Card header: title + badges + delete button */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md shrink-0" />
            </div>

            {/* Mini table of entregas */}
            <div className="rounded-md border overflow-hidden">
              <div className="border-b bg-muted/30 px-3 py-2 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-full max-w-16" />
                ))}
              </div>
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="border-b last:border-0 px-3 py-2 grid grid-cols-4 gap-3 items-center"
                >
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-20 rounded-md ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
