'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AppWindow,
  Users,
  UserCog,
  FileText,
  BookOpen,
  Home,
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
  },
  {
    href: '/admin/employees',
    label: 'Staff',
    icon: UserCog,
  },
  {
    href: '/admin/audit-log',
    label: 'Audit',
    icon: FileText,
  },
  {
    href: '/admin/docs',
    label: 'Help',
    icon: BookOpen,
  },
  {
    href: '/',
    label: 'Portal',
    icon: Home,
    exact: true,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-50 safe-area-pb">
      <nav className="flex justify-around" data-testid="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
