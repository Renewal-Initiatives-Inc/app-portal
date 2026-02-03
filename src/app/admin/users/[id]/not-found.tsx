import Link from 'next/link';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <UserX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold">User Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        The user you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Button asChild className="mt-6" data-testid="user-not-found-back-btn">
        <Link href="/admin/users">Back to Users</Link>
      </Button>
    </div>
  );
}
