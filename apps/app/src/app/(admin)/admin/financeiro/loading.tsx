import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceiroLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe os pagamentos e a projeção mensal das mensalidades ativas.
        </p>
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-36 mb-3" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-40 mt-2" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Registros table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="border-b last:border-0 px-4 py-3 grid grid-cols-5 gap-4 items-center"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
