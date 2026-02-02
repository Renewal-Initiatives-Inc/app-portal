import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SignOutButton } from './sign-out-button';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

import { signOut } from 'next-auth/react';

describe('SignOutButton', () => {
  it('renders sign out button', () => {
    render(<SignOutButton />);
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls signOut when clicked', () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByTestId('sign-out-button'));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('renders with default outline variant', () => {
    render(<SignOutButton />);
    const button = screen.getByTestId('sign-out-button');
    expect(button).toHaveClass('border');
  });

  it('renders with ghost variant when specified', () => {
    render(<SignOutButton variant="ghost" />);
    const button = screen.getByTestId('sign-out-button');
    expect(button).not.toHaveClass('border');
  });
});
