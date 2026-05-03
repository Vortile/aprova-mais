import { Skeleton } from "@/components/ui/skeleton";

export default function AlunosLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Student limit progress card */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Toolbar: count + button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Table header */}
        <div className="border-b px-4 py-3 grid grid-cols-6 gap-4">
          {["Nome", "Mensalidade", "Conta", "Série", "Disciplinas", ""].map(
            (col) => (
              <Skeleton key={col} className="h-4 w-20" />
            ),
          )}
        </div>

        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-b last:border-0 px-4 py-3 grid grid-cols-6 gap-4 items-center"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-7 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
