import { http, HttpResponse } from 'msw';

// Mock data
const mockApps = [
  {
    id: '1',
    name: 'Test App 1',
    slug: 'test-app-1',
    description: 'A test application for testing purposes',
    appUrl: 'https://test-app-1.example.com',
    iconUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Test App 2',
    slug: 'test-app-2',
    description: 'Another test application for testing purposes',
    appUrl: 'https://test-app-2.example.com',
    iconUrl: 'https://example.com/icon.png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
    isActive: true,
    appPermissions: [],
  },
  {
    id: 'user-2',
    email: 'regular@example.com',
    firstName: 'Regular',
    lastName: 'User',
    isAdmin: false,
    isActive: true,
    appPermissions: ['test-app-1'],
  },
];

const mockAuditLogs = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userEmail: 'admin@example.com',
    action: 'APP_CREATED',
    appId: '1',
    timestamp: new Date().toISOString(),
  },
];

const mockNotifications = [
  {
    id: 'notif-1',
    userId: 'user-1',
    message: 'New user invited: test@example.com',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

// Session mock
const mockSession = {
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    roles: ['admin'],
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const handlers = [
  // Auth session endpoint
  http.get('/api/auth/session', () => {
    return HttpResponse.json(mockSession);
  }),

  // Auth CSRF endpoint
  http.get('/api/auth/csrf', () => {
    return HttpResponse.json({ csrfToken: 'mock-csrf-token' });
  }),

  // Upload endpoint - POST
  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return HttpResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > 1024 * 1024) {
      return HttpResponse.json(
        { error: 'File too large. Maximum size is 1MB.' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      url: `https://mock-blob-storage.com/app-icons/${Date.now()}.png`,
    });
  }),

  // Upload endpoint - DELETE
  http.delete('/api/upload', async ({ request }) => {
    const body = await request.json() as { url?: string };

    if (!body.url) {
      return HttpResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Cron cleanup endpoint
  http.get('/api/cron/cleanup', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== 'Bearer mock-cron-secret') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      deleted: { notifications: 10 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Mock apps data endpoint (for integration tests)
  http.get('/api/apps', () => {
    return HttpResponse.json(mockApps);
  }),

  http.get('/api/apps/:id', ({ params }) => {
    const app = mockApps.find(a => a.id === params.id);
    if (!app) {
      return HttpResponse.json({ error: 'App not found' }, { status: 404 });
    }
    return HttpResponse.json(app);
  }),

  http.post('/api/apps', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newApp = {
      id: String(mockApps.length + 1),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newApp, { status: 201 });
  }),

  http.put('/api/apps/:id', async ({ params, request }) => {
    const app = mockApps.find(a => a.id === params.id);
    if (!app) {
      return HttpResponse.json({ error: 'App not found' }, { status: 404 });
    }
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...app, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete('/api/apps/:id', ({ params }) => {
    const appIndex = mockApps.findIndex(a => a.id === params.id);
    if (appIndex === -1) {
      return HttpResponse.json({ error: 'App not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Mock users data endpoint
  http.get('/api/users', () => {
    return HttpResponse.json(mockUsers);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = mockUsers.find(u => u.id === params.id);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  // Mock audit logs endpoint
  http.get('/api/audit-logs', () => {
    return HttpResponse.json(mockAuditLogs);
  }),

  // Mock notifications endpoint
  http.get('/api/notifications', () => {
    return HttpResponse.json(mockNotifications);
  }),

  http.post('/api/notifications/:id/read', ({ params }) => {
    const notif = mockNotifications.find(n => n.id === params.id);
    if (!notif) {
      return HttpResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/notifications/read-all', () => {
    return HttpResponse.json({ success: true });
  }),
];
