import { Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRowActions } from './user-row-actions';
import type { PortalUser } from '@/lib/zitadel';

interface UserTableProps {
  users: PortalUser[];
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

function getStatusBadgeVariant(status: PortalUser['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="users-empty-state"
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No users found</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Get started by inviting your first user to the portal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border" data-testid="users-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <span className="sr-only">Avatar</span>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Roles</TableHead>
            <TableHead className="hidden xl:table-cell">Created</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt="" />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.firstName, user.lastName, user.email)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{user.displayName || user.email}</p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    {user.email}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                    <Badge
                      variant={getStatusBadgeVariant(user.status)}
                      className="text-xs capitalize"
                    >
                      {user.status}
                    </Badge>
                    {user.isAdmin && (
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge
                  variant={getStatusBadgeVariant(user.status)}
                  className="capitalize"
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {user.isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  )}
                  {user.roles.slice(0, 2).map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {role.replace('app:', '')}
                    </Badge>
                  ))}
                  {user.roles.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{user.roles.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <span className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                <UserRowActions user={user} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
