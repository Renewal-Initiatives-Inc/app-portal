import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminNav } from './admin-nav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin'),
}));

describe('AdminNav', () => {
  it('renders all navigation items', () => {
    render(<AdminNav />);

    expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-apps')).toBeInTheDocument();
    expect(screen.getByTestId('nav-back-to-portal')).toBeInTheDocument();
  });

  it('renders Dashboard link to /admin', () => {
    render(<AdminNav />);

    const dashboardLink = screen.getByTestId('nav-dashboard');
    expect(dashboardLink).toHaveAttribute('href', '/admin');
  });

  it('renders Apps link to /admin/apps', () => {
    render(<AdminNav />);

    const appsLink = screen.getByTestId('nav-apps');
    expect(appsLink).toHaveAttribute('href', '/admin/apps');
  });

  it('renders Back to Portal link', () => {
    render(<AdminNav />);

    const backLink = screen.getByTestId('nav-back-to-portal');
    expect(backLink).toHaveAttribute('href', '/');
    expect(screen.getByText('Back to Portal')).toBeInTheDocument();
  });

  it('shows disabled items for future features', () => {
    render(<AdminNav />);

    // Users and Audit Log should be visible but disabled
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });
});
