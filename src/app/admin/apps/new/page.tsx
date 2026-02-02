import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppForm } from '@/components/admin/app-form';

export const metadata = {
  title: 'Add App | Admin Portal',
  description: 'Register a new application',
};

export default function NewAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/apps"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Apps
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Add New App</h1>
        <p className="text-muted-foreground mt-1">
          Register a new application in the portal.
        </p>
      </div>

      <AppForm mode="create" />
    </div>
  );
}
