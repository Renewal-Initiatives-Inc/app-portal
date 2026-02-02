import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAppById } from '@/lib/db/apps';
import { AppForm } from '@/components/admin/app-form';

interface EditAppPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditAppPageProps) {
  const { id } = await params;
  const app = await getAppById(id);

  if (!app) {
    return { title: 'App Not Found | Admin Portal' };
  }

  return {
    title: `Edit ${app.name} | Admin Portal`,
    description: `Edit ${app.name} application settings`,
  };
}

export default async function EditAppPage({ params }: EditAppPageProps) {
  const { id } = await params;
  const app = await getAppById(id);

  if (!app) {
    notFound();
  }

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
        <h1 className="text-2xl font-semibold text-foreground">
          Edit {app.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Update the application settings.
        </p>
      </div>

      <AppForm app={app} mode="edit" />
    </div>
  );
}
