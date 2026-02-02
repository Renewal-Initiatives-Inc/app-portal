import Link from 'next/link';
import { getAllApps } from '@/lib/db/apps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppWindow, Plus, Users, FileText } from 'lucide-react';

export default async function AdminDashboard() {
  const apps = await getAllApps();
  const appCount = apps.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application registry and users.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card data-testid="stat-apps">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered Apps
            </CardTitle>
            <AppWindow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{appCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Applications in registry
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-50" data-testid="stat-users">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coming in Phase 5
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-50" data-testid="stat-audit">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audit Events
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coming in Phase 6
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/apps/new" data-testid="action-add-app">
              <Plus className="mr-2 h-4 w-4" />
              Add New App
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/apps" data-testid="action-view-apps">
              <AppWindow className="mr-2 h-4 w-4" />
              View All Apps
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Apps */}
      {appCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {apps.slice(0, 5).map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {app.iconUrl ? (
                      <img
                        src={app.iconUrl}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <AppWindow className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{app.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.slug}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/apps/${app.id}/edit`}>Edit</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
