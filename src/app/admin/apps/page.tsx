import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { getAllApps } from '@/lib/db/apps';
import { Button } from '@/components/ui/button';
import { AppTable } from '@/components/admin/app-table';
import { AppTableSkeleton } from '@/components/admin/app-table-skeleton';

export const metadata = {
  title: 'Apps | Admin Portal',
  description: 'Manage registered applications',
};

async function AppsContent() {
  const apps = await getAllApps();
  return <AppTable apps={apps} />;
}

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Apps</h1>
          <p className="text-muted-foreground mt-1">
            Manage registered applications in the portal.
          </p>
        </div>
        <Button asChild data-testid="add-app-button" className="w-full sm:w-auto">
          <Link href="/admin/apps/new">
            <Plus className="mr-2 h-4 w-4" />
            Add App
          </Link>
        </Button>
      </div>

      <Suspense fallback={<AppTableSkeleton />}>
        <AppsContent />
      </Suspense>
    </div>
  );
}
