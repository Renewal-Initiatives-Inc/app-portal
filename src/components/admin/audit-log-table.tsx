import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AuditLogWithApp, AuditAction, AUDIT_ACTIONS } from '@/lib/db/audit-logs';

interface AuditLogTableProps {
  logs: AuditLogWithApp[];
}

/**
 * Format date/time for display
 */
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get initials from email
 */
function getInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

/**
 * Map action to human-readable label and badge variant
 */
function getActionDisplay(action: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const actionMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    app_access: { label: 'App Access', variant: 'default' },
    app_created: { label: 'App Created', variant: 'secondary' },
    app_updated: { label: 'App Updated', variant: 'secondary' },
    app_deleted: { label: 'App Deleted', variant: 'destructive' },
    user_invited: { label: 'User Invited', variant: 'secondary' },
    user_deactivated: { label: 'User Deactivated', variant: 'destructive' },
    user_reactivated: { label: 'User Reactivated', variant: 'secondary' },
    permissions_updated: { label: 'Permissions Updated', variant: 'outline' },
  };

  return actionMap[action] || { label: action, variant: 'outline' };
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="audit-log-empty-state"
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No audit events</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Audit events will appear here as users interact with the portal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto" data-testid="audit-log-table">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="hidden md:table-cell">App</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const actionDisplay = getActionDisplay(log.action);
            return (
              <TableRow key={log.id} data-testid={`audit-log-row-${log.id}`}>
                <TableCell>
                  <span className="text-sm">
                    {formatDateTime(log.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {getInitials(log.userEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[150px] md:max-w-[200px]">
                      {log.userEmail}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={actionDisplay.variant}>
                    {actionDisplay.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {log.appName ? (
                    <span className="text-sm text-muted-foreground">
                      {log.appName}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
