import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders default title and description', () => {
    render(<EmptyState />);
    expect(screen.getByText('No apps available')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Contact an administrator to request access to applications.'
      )
    ).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyState title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<EmptyState description="Custom description text" />);
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<EmptyState />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
