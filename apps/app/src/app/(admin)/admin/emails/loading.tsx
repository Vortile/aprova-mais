import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function EmailsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 mt-1" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List and Navigation Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-9 w-50" />
            <Skeleton className="h-9 w-30" />
          </div>

          <Skeleton className="h-10 w-full" />

          <Card>
            <CardContent className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Details View Skeleton */}
        <div className="lg:col-span-1">
          <Card className="h-100">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full space-y-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
