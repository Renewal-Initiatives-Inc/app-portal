'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function AuditLogPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: AuditLogPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete('page');
      } else {
        params.set('page', page.toString());
      }

      startTransition(() => {
        router.push(`/admin/audit-log?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="flex items-center justify-between px-2"
      data-testid="audit-log-pagination"
    >
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} events
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          data-testid="pagination-prev"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1 text-sm">
          <span>Page</span>
          <span className="font-medium">{currentPage}</span>
          <span>of</span>
          <span className="font-medium">{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          data-testid="pagination-next"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
