import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from '../mocks/server';

// Mock server actions that have next-auth dependencies
vi.mock('@/app/actions/log-app-access', () => ({
  logAppAccessAction: vi.fn(() => Promise.resolve()),
}));

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});
