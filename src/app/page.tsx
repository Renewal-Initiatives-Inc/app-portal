import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

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
        <Card data-testid="welcome-card">
          <CardHeader>
            <CardTitle>Welcome, {session.user.name || 'User'}</CardTitle>
            <CardDescription>
              You are signed in to the Renewal Initiatives App Portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your authorized applications will appear here once configured.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
