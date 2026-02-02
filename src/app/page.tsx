import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { getAuthorizedApps } from '@/lib/db/apps';
import { SignOutButton } from '@/components/sign-out-button';
import { AppCard } from '@/components/app-card';
import { EmptyState } from '@/components/empty-state';
import { AppGridSkeleton } from '@/components/app-grid-skeleton';

async function AppGrid({ userRoles }: { userRoles: string[] }) {
  const apps = await getAuthorizedApps(userRoles);

  if (apps.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="app-grid"
    >
      {apps.map((app) => (
        <AppCard
          key={app.id}
          id={app.id}
          slug={app.slug}
          name={app.name}
          description={app.description}
          iconUrl={app.iconUrl}
          appUrl={app.appUrl}
        />
      ))}
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userRoles = session.user.roles || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1
            className="text-xl font-semibold text-primary"
            data-testid="portal-title"
          >
            App Portal
          </h1>
          <div className="flex items-center gap-4">
            <span
              className="text-sm text-muted-foreground"
              data-testid="user-email"
            >
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h2
            className="text-2xl font-semibold text-foreground"
            data-testid="welcome-heading"
          >
            Welcome, {session.user.name || 'User'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Select an application to get started.
          </p>
        </div>

        <Suspense fallback={<AppGridSkeleton />}>
          <AppGrid userRoles={userRoles} />
        </Suspense>
      </main>
    </div>
  );
}
