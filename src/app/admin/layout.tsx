import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { AdminHeader } from '@/components/admin-header';
import { AdminNav } from '@/components/admin-nav';
import { MobileNav } from '@/components/admin/mobile-nav';
import { SkipLink } from '@/components/skip-link';
import { getNotifications, getUnreadCount } from '@/lib/db/notifications';

export const metadata = {
  title: 'Admin | App Portal',
  description: 'Admin dashboard for managing apps and users',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userRoles = session.user.roles || [];

  if (!isAdmin(userRoles)) {
    redirect('/?error=access_denied');
  }

  // Fetch notifications for the current admin
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(session.user.id, 10),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SkipLink />
      <AdminHeader notifications={notifications} unreadCount={unreadCount} />

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-white p-4" role="navigation" aria-label="Admin navigation">
          <AdminNav />
        </aside>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <main id="main-content" className="flex-1 p-6 pb-24 md:pb-6" role="main">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
