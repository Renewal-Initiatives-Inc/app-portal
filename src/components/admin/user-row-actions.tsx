'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, UserX, UserCheck, Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeactivateUserDialog } from './deactivate-user-dialog';
import { ReactivateUserDialog } from './reactivate-user-dialog';
import type { PortalUser } from '@/lib/zitadel';

interface UserRowActionsProps {
  user: PortalUser;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const isInactive = user.status === 'inactive';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            data-testid={`user-actions-${user.id}`}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/users/${user.id}`}
              className="flex items-center"
              data-testid={`edit-user-${user.id}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Permissions
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {user.isAdmin ? (
            <DropdownMenuItem
              className="flex items-center"
              asChild
            >
              <Link
                href={`/admin/users/${user.id}?action=remove-admin`}
                className="flex items-center"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Remove Admin Role
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/users/${user.id}?action=make-admin`}
                className="flex items-center"
              >
                <Shield className="mr-2 h-4 w-4" />
                Make Admin
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isInactive ? (
            <DropdownMenuItem
              className="flex items-center text-green-600 focus:text-green-600"
              onSelect={(e) => {
                e.preventDefault();
                setShowReactivateDialog(true);
              }}
              data-testid={`reactivate-user-${user.id}`}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Reactivate User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setShowDeactivateDialog(true);
              }}
              data-testid={`deactivate-user-${user.id}`}
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeactivateUserDialog
        user={user}
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      />

      <ReactivateUserDialog
        user={user}
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
      />
    </>
  );
}
