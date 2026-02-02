import { Suspense } from 'react';
import {
  getAuditLogs,
  getAuditLogUsers,
  type AuditAction,
} from '@/lib/db/audit-logs';
import { getAllApps } from '@/lib/db/apps';
import { AuditLogTable } from '@/components/admin/audit-log-table';
import { AuditLogFilters } from '@/components/admin/audit-log-filters';
import { AuditLogPagination } from '@/components/admin/audit-log-pagination';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Audit Log | Admin Portal',
  description: 'View activity history and access logs',
};

interface AuditLogPageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    user?: string;
    app?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

const PAGE_SIZE = 25;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));

  // Parse filters
  const filters = {
    action: params.action as AuditAction | undefined,
    userId: params.user || undefined,
    appId: params.app || undefined,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate
      ? new Date(params.endDate + 'T23:59:59')
      : undefined,
  };

  // Fetch data in parallel
  const [auditData, users, apps] = await Promise.all([
    getAuditLogs(filters, { page, pageSize: PAGE_SIZE }),
    getAuditLogUsers(),
    getAllApps(),
  ]);

  const totalPages = Math.ceil(auditData.total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          View activity history and access logs for the portal.
        </p>
      </div>

      <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-md" />}>
        <AuditLogFilters users={users} apps={apps} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <AuditLogTable logs={auditData.logs} />
      </Suspense>

      <Suspense fallback={null}>
        <AuditLogPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={auditData.total}
          pageSize={PAGE_SIZE}
        />
      </Suspense>
    </div>
  );
}
