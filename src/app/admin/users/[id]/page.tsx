import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPermissionsForm } from '@/components/admin/user-permissions-form';
import { getAllApps } from '@/lib/db/apps';
import { getUserById, isZitadelManagementConfigured } from '@/lib/zitadel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/auth';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const user = await getUserById(id);

  return {
    title: user ? `${user.displayName} | Admin` : 'User Not Found | Admin',
    description: 'Manage user permissions',
  };
}

function getInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default async function UserDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { action } = await searchParams;

  if (!isZitadelManagementConfigured()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild data-testid="user-detail-back-link-disabled">
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>

        <Alert variant="destructive" data-testid="zitadel-not-configured">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Zitadel Management API Not Configured</AlertTitle>
          <AlertDescription>
            User management requires Zitadel service account configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [user, apps, session] = await Promise.all([
    getUserById(id),
    getAllApps(),
    auth(),
  ]);

  if (!user) {
    notFound();
  }

  const isCurrentUser = session?.user?.id === user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild data-testid="user-detail-back-link">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      {/* User Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback className="text-lg">
              {getInitials(user.firstName, user.lastName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {user.displayName || user.email}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                {user.status}
              </Badge>
              {user.isAdmin && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {isCurrentUser && (
                <Badge variant="secondary">You</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user.status !== 'inactive' && !isCurrentUser && (
          <div className="flex gap-2">
            <form action={`/admin/users/${user.id}?action=deactivate`} method="POST">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                asChild
                data-testid="user-detail-deactivate-btn"
              >
                <Link href={`/admin/users?deactivate=${user.id}`}>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </Link>
              </Button>
            </form>
          </div>
        )}

        {user.status === 'inactive' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-600"
              asChild
              data-testid="user-detail-reactivate-btn"
            >
              <Link href={`/admin/users?reactivate=${user.id}`}>
                <UserCheck className="mr-2 h-4 w-4" />
                Reactivate
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Permissions Form */}
      <UserPermissionsForm
        user={user}
        apps={apps}
        isCurrentUser={isCurrentUser}
        initialAction={action}
      />
    </div>
  );
}
