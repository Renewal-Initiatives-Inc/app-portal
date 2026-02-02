import { AppWindow } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AppRowActions } from './app-row-actions';
import type { App } from '@/lib/db/apps';

interface AppTableProps {
  apps: App[];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function AppTable({ apps }: AppTableProps) {
  if (apps.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="apps-empty-state"
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <AppWindow className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No apps registered</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Get started by adding your first application to the registry.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border" data-testid="apps-table">
      <Table>
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
          {apps.map((app) => (
            <TableRow key={app.id} data-testid={`app-row-${app.slug}`}>
              <TableCell>
                {app.iconUrl ? (
                  <img
                    src={app.iconUrl}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    <AppWindow className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{app.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 md:hidden">
                    {app.slug}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className="font-mono text-xs">
                  {app.slug}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <a
                  href={app.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline truncate max-w-[200px] block"
                >
                  {app.appUrl}
                </a>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="text-sm text-muted-foreground">
                  {formatDate(app.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                <AppRowActions app={app} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
