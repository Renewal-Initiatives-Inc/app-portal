import { Package } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

/**
 * Empty state component displayed when user has no authorized apps
 */
export function EmptyState({
  title = 'No apps available',
  description = 'Contact an administrator to request access to applications.',
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="empty-state"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
