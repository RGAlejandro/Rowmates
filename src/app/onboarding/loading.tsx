import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
