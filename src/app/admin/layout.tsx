import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { AdminHeader } from '@/components/admin-header';
import { AdminNav } from '@/components/admin-nav';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-white p-4">
          <AdminNav />
        </aside>

        {/* Mobile Navigation - Sheet trigger could be added here */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white p-2 z-50">
          <div className="flex justify-around">
            <Link href="/admin" className="flex flex-col items-center p-2 text-xs">
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </Link>
            <Link href="/admin/apps" className="flex flex-col items-center p-2 text-xs">
              <span className="text-lg">📱</span>
              <span>Apps</span>
            </Link>
            <Link href="/" className="flex flex-col items-center p-2 text-xs">
              <span className="text-lg">🏠</span>
              <span>Portal</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
