'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AuditLogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error details to console for debugging
    console.error('[Audit Log Error]', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          An error occurred while loading this page.
        </p>
      </div>

      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive/80">
          Something went wrong loading the audit log. Please try again or contact support if the issue persists.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-2">
            Error reference: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Hard refresh
        </Button>
      </div>
    </div>
  );
}
