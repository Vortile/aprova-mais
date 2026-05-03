import { Skeleton } from "@/components/ui/skeleton";

export default function ProfessoresLoading() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Professores</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os professores com acesso à plataforma.
        </p>
      </div>

      {/* Toolbar: count + button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3 grid grid-cols-4 gap-4">
          {["Nome", "Email", "Status", ""].map((col) => (
            <Skeleton key={col} className="h-4 w-20" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b last:border-0 px-4 py-3 grid grid-cols-4 gap-4 items-center"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
