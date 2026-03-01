import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Home, LogIn, RefreshCw } from 'lucide-react';

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

interface ErrorInfo {
  title: string;
  message: string;
  suggestion: string;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;

  const errorInfo: Record<string, ErrorInfo> = {
    Configuration: {
      title: 'Configuration Error',
      message: 'There is a problem with the authentication setup.',
      suggestion: 'Please contact your administrator if this problem persists.',
    },
    AccessDenied: {
      title: 'Access Denied',
      message: 'You do not have permission to access this application.',
      suggestion: 'If you believe this is a mistake, please contact your administrator to request access.',
    },
    Verification: {
      title: 'Verification Failed',
      message: 'The verification link may have expired or already been used.',
      suggestion: 'Please request a new verification email or contact your administrator.',
    },
    OAuthSignin: {
      title: 'Sign In Error',
      message: 'There was a problem starting the sign-in process.',
      suggestion: 'Please try again. If the problem continues, try clearing your browser cookies.',
    },
    OAuthCallback: {
      title: 'Sign In Error',
      message: 'There was a problem completing the sign-in process.',
      suggestion: 'Please try again. If the problem continues, contact your administrator.',
    },
    OAuthAccountNotLinked: {
      title: 'Account Not Linked',
      message: 'This email is already associated with a different sign-in method.',
      suggestion: 'Try signing in with the method you used originally, or contact your administrator.',
    },
    Callback: {
      title: 'Callback Error',
      message: 'There was a problem processing your sign-in.',
      suggestion: 'Please try again. If the problem continues, contact your administrator.',
    },
    SessionRequired: {
      title: 'Session Expired',
      message: 'Your session has expired or you need to sign in.',
      suggestion: 'Please sign in again to continue.',
    },
    Default: {
      title: 'Authentication Error',
      message: 'An unexpected error occurred during authentication.',
      suggestion: 'Please try again. If the problem continues, contact your administrator.',
    },
  };

  const error = params.error || 'Default';
  const info = errorInfo[error] || errorInfo.Default;
  const isSessionExpired = error === 'SessionRequired';

  if (isSessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle data-testid="auth-error-title">
              Looks like you&apos;ve been away for a bit!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center" data-testid="auth-error-message">
              Your session timed out while you were off being awesome.
              No worries — just sign back in and you&apos;ll be right where
              you left off. Believe.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" data-testid="auth-error-signin">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In Again
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle data-testid="auth-error-title">{info.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" data-testid="auth-error-alert">
            <AlertDescription>{info.message}</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground text-center">
            {info.suggestion}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full" data-testid="auth-error-retry">
            <Link href="/login">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" data-testid="auth-error-home">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
