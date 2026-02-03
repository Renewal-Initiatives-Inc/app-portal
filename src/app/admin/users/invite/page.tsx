import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserInviteForm } from '@/components/admin/user-invite-form';
import { getAllApps } from '@/lib/db/apps';
import { isZitadelManagementConfigured } from '@/lib/zitadel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Invite User | Admin',
  description: 'Invite a new user to the portal',
};

export default async function InviteUserPage() {
  // Get all apps for permission selection
  const apps = await getAllApps();

  if (!isZitadelManagementConfigured()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild data-testid="user-invite-back-link-error">
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
            User invitation requires Zitadel service account configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild data-testid="user-invite-back-link">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Invite User</h1>
        <p className="text-muted-foreground mt-1">
          Send an invitation email to add a new user to the portal.
        </p>
      </div>

      <div className="max-w-2xl">
        <UserInviteForm apps={apps} />
      </div>
    </div>
  );
}
