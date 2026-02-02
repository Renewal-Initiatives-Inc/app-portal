'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AppWindow,
  Users,
  FileText,
  ArrowLeft,
} from 'lucide-react';

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/apps',
    label: 'Apps',
    icon: AppWindow,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    disabled: true, // Phase 5
  },
  {
    href: '/admin/audit-log',
    label: 'Audit Log',
    icon: FileText,
    disabled: true, // Phase 6
  },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-1" data-testid="admin-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);

        if (item.disabled) {
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="my-4 border-t" />

      <Link
        href="/"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        data-testid="nav-back-to-portal"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Portal</span>
      </Link>
    </nav>
  );
}
