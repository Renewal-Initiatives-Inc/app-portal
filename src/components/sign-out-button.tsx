'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
}

export function SignOutButton({ variant = 'outline' }: SignOutButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => signOut({ callbackUrl: '/login' })}
      data-testid="sign-out-button"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
