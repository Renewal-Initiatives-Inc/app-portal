import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppTable } from './app-table';
import type { App } from '@/lib/db/apps';

// Mock the AppRowActions component since it has complex dependencies
vi.mock('./app-row-actions', () => ({
  AppRowActions: ({ app }: { app: App }) => (
    <button data-testid={`actions-${app.slug}`}>Actions</button>
  ),
}));

const mockApps: App[] = [
  {
    id: '1',
    slug: 'timesheets',
    name: 'Timesheets',
    description: 'Track and submit work hours',
    iconUrl: 'https://example.com/icon.png',
    appUrl: 'https://timesheets.example.com',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    slug: 'proposal-rodeo',
    name: 'Proposal Rodeo',
    description: 'Manage grant proposals',
    iconUrl: null,
    appUrl: 'https://proposals.example.com',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

describe('AppTable', () => {
  it('renders empty state when no apps', () => {
    render(<AppTable apps={[]} />);

    expect(screen.getByTestId('apps-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No apps registered')).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by adding your first application/)
    ).toBeInTheDocument();
  });

  it('renders table with apps', () => {
    render(<AppTable apps={mockApps} />);

    expect(screen.getByTestId('apps-table')).toBeInTheDocument();
    expect(screen.getByText('Timesheets')).toBeInTheDocument();
    expect(screen.getByText('Proposal Rodeo')).toBeInTheDocument();
  });

  it('renders app slugs as badges', () => {
    render(<AppTable apps={mockApps} />);

    // Slug appears both in badge and mobile view, so use getAllByText
    expect(screen.getAllByText('timesheets').length).toBeGreaterThan(0);
    expect(screen.getAllByText('proposal-rodeo').length).toBeGreaterThan(0);
  });

  it('renders app URLs as links', () => {
    render(<AppTable apps={mockApps} />);

    const timesheetsLink = screen.getByText('https://timesheets.example.com');
    expect(timesheetsLink).toHaveAttribute(
      'href',
      'https://timesheets.example.com'
    );
    expect(timesheetsLink).toHaveAttribute('target', '_blank');
  });

  it('renders icon when iconUrl is present', () => {
    const { container } = render(<AppTable apps={mockApps} />);

    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/icon.png');
  });

  it('renders actions for each app', () => {
    render(<AppTable apps={mockApps} />);

    expect(screen.getByTestId('actions-timesheets')).toBeInTheDocument();
    expect(screen.getByTestId('actions-proposal-rodeo')).toBeInTheDocument();
  });

  it('renders row test ids for each app', () => {
    render(<AppTable apps={mockApps} />);

    expect(screen.getByTestId('app-row-timesheets')).toBeInTheDocument();
    expect(screen.getByTestId('app-row-proposal-rodeo')).toBeInTheDocument();
  });
});
