'use client';

import { useSession } from 'next-auth/react';
import { SignOutButton } from '@/components/sign-out-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AdminHeader() {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header
      className="border-b bg-white px-6 py-4"
      data-testid="admin-header"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-primary">Admin Portal</h1>
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p
                className="text-sm font-medium"
                data-testid="admin-user-name"
              >
                {session?.user?.name || 'User'}
              </p>
              <p
                className="text-xs text-muted-foreground"
                data-testid="admin-user-email"
              >
                {session?.user?.email}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
