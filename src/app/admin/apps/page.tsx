import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllApps } from '@/lib/db/apps';
import { Button } from '@/components/ui/button';
import { AppTable } from '@/components/admin/app-table';

export const metadata = {
  title: 'Apps | Admin Portal',
  description: 'Manage registered applications',
};

export default async function AppsPage() {
  const apps = await getAllApps();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Apps</h1>
          <p className="text-muted-foreground mt-1">
            Manage registered applications in the portal.
          </p>
        </div>
        <Button asChild data-testid="add-app-button">
          <Link href="/admin/apps/new">
            <Plus className="mr-2 h-4 w-4" />
            Add App
          </Link>
        </Button>
      </div>

      <AppTable apps={apps} />
    </div>
  );
}
