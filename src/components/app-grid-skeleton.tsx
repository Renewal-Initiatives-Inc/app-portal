import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AppGridSkeletonProps {
  count?: number;
}

/**
 * Loading skeleton for the app grid
 * Displays placeholder cards while apps are loading
 */
export function AppGridSkeleton({ count = 6 }: AppGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="app-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-4 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
