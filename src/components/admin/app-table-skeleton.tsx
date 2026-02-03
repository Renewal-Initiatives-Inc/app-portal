import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AppTableSkeleton() {
  return (
    <div className="rounded-md border overflow-x-auto" data-testid="apps-table-skeleton">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Icon</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Slug</TableHead>
            <TableHead className="hidden lg:table-cell">URL</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24 md:hidden" />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
