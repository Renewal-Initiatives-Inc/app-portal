import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppCard } from './app-card';

const defaultProps = {
  id: 'test-id',
  slug: 'timesheets',
  name: 'Timesheets',
  description: 'Track your work hours',
  iconUrl: null,
  appUrl: 'https://timesheets.example.com',
};

describe('AppCard', () => {
  it('renders app name', () => {
    render(<AppCard {...defaultProps} />);
    expect(screen.getByText('Timesheets')).toBeInTheDocument();
  });

  it('renders app description', () => {
    render(<AppCard {...defaultProps} />);
    expect(screen.getByText('Track your work hours')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(<AppCard {...defaultProps} description={null} />);
    expect(screen.getByText('Timesheets')).toBeInTheDocument();
    expect(screen.queryByTestId(`app-card-description-${defaultProps.id}`)).not.toBeInTheDocument();
  });

  it('renders icon fallback when no iconUrl', () => {
    render(<AppCard {...defaultProps} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders image when iconUrl provided', () => {
    render(<AppCard {...defaultProps} iconUrl="https://example.com/icon.png" />);
    // Image has alt="" for decorative purposes, so we query by tag
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  it('links to appUrl with correct attributes', () => {
    render(<AppCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://timesheets.example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has correct test id', () => {
    render(<AppCard {...defaultProps} />);
    expect(screen.getByTestId('app-card-timesheets')).toBeInTheDocument();
  });
});
