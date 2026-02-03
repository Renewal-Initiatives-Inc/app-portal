import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">App not found</h2>
      <p className="text-muted-foreground mt-1 max-w-sm">
        The application you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Button asChild className="mt-4" data-testid="app-not-found-back-btn">
        <Link href="/admin/apps">Back to Apps</Link>
      </Button>
    </div>
  );
}
