import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/admin/user-table';
import { UserTableSkeleton } from '@/components/admin/user-table-skeleton';
import { listUsers, isZitadelManagementConfigured } from '@/lib/zitadel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Users | Admin',
  description: 'Manage user accounts and permissions',
};

async function UsersContent() {
  if (!isZitadelManagementConfigured()) {
    return (
      <Alert variant="destructive" data-testid="zitadel-not-configured">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Zitadel Management API Not Configured</AlertTitle>
        <AlertDescription>
          User management requires Zitadel service account configuration. Please set
          the following environment variables:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>ZITADEL_SERVICE_ACCOUNT_USER_ID</li>
            <li>ZITADEL_SERVICE_ACCOUNT_KEY_ID</li>
            <li>ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY</li>
            <li>ZITADEL_PROJECT_ID</li>
            <li>ZITADEL_ORG_ID</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  const users = await listUsers();

  return <UserTable users={users} />;
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and application permissions.
          </p>
        </div>
        <Button asChild data-testid="invite-user-button">
          <Link href="/admin/users/invite">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Link>
        </Button>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}
