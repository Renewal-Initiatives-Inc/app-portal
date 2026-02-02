import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function LoginPage() {
  const session = await auth();

  // If already logged in, redirect to portal
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md" data-testid="login-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">App Portal</CardTitle>
          <CardDescription>
            Sign in to access Renewal Initiatives tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              'use server';
              await signIn('zitadel', { redirectTo: '/' });
            }}
          >
            <Button
              type="submit"
              className="w-full"
              data-testid="login-submit"
            >
              Sign in with Zitadel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
