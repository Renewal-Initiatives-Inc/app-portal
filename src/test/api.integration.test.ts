import { describe, it, expect } from 'vitest';

describe('API Integration Tests with MSW', () => {
  describe('Auth Session Endpoint', () => {
    it('should return mock session data', async () => {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@example.com');
      expect(data.user.roles).toContain('admin');
    });

    it('should return CSRF token', async () => {
      const response = await fetch('/api/auth/csrf');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.csrfToken).toBeDefined();
    });
  });

  describe('Apps API', () => {
    it('should return list of apps', async () => {
      const response = await fetch('/api/apps');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should return single app by ID', async () => {
      const response = await fetch('/api/apps/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe('1');
      expect(data.name).toBe('Test App 1');
    });

    it('should return 404 for non-existent app', async () => {
      const response = await fetch('/api/apps/999');

      expect(response.status).toBe(404);
    });

    it('should create new app', async () => {
      const newApp = {
        name: 'New Test App',
        slug: 'new-test-app',
        description: 'A brand new test application',
        appUrl: 'https://new-test-app.example.com',
      };

      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Test App');
      expect(data.id).toBeDefined();
    });

    it('should update existing app', async () => {
      const updates = {
        name: 'Updated App Name',
      };

      const response = await fetch('/api/apps/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.name).toBe('Updated App Name');
    });

    it('should delete app', async () => {
      const response = await fetch('/api/apps/1', {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Users API', () => {
    it('should return list of users', async () => {
      const response = await fetch('/api/users');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should return user by ID', async () => {
      const response = await fetch('/api/users/user-1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe('user-1');
      expect(data.email).toBe('admin@example.com');
      expect(data.isAdmin).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch('/api/users/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('Audit Logs API', () => {
    it('should return audit logs', async () => {
      const response = await fetch('/api/audit-logs');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Notifications API', () => {
    it('should return notifications', async () => {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should mark notification as read', async () => {
      const response = await fetch('/api/notifications/notif-1/read', {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Upload API', () => {
    it('should reject upload without file', async () => {
      const formData = new FormData();

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
    });

    // Skip FormData tests in jsdom - FormData with File objects times out in node/jsdom environment
    it.skip('should reject upload with invalid file type', async () => {
      const formData = new FormData();
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
    });

    // Skip FormData tests in jsdom - FormData with File objects times out in node/jsdom environment
    it.skip('should accept valid image upload', async () => {
      const formData = new FormData();
      // Create a mock PNG file
      const file = new File(['fake png data'], 'test.png', { type: 'image/png' });
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.url).toBeDefined();
    });

    it('should delete file', async () => {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/test.png' }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should reject delete without URL', async () => {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Cron Cleanup API', () => {
    it('should reject unauthorized cron requests', async () => {
      const response = await fetch('/api/cron/cleanup');

      expect(response.status).toBe(401);
    });

    it('should accept authorized cron requests', async () => {
      const response = await fetch('/api/cron/cleanup', {
        headers: {
          Authorization: 'Bearer mock-cron-secret',
        },
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.deleted).toBeDefined();
    });
  });
});
