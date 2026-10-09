import { Skeleton } from "@/components/ui/skeleton";

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-[2/3] w-full" />
      ))}
    </div>
  );
}

export function FilmSkeleton() {
  return (
    <div className="space-y-10" aria-busy>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Skeleton className="aspect-[2/3] w-36 sm:w-44" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-64" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8" aria-busy>
      <div className="flex items-center gap-5">
        <Skeleton className="size-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-full" />
      <GridSkeleton count={6} />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-10 w-72" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
