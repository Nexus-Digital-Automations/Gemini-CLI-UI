import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import type { LoginInput, AuthResponse } from '@gemini-ui/shared';

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn<[LoginInput], Promise<void>>();
  const mockOnSwitchToRegister = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSwitchToRegister.mockClear();
  });

  it('should render login form', () => {
    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should call onSubmit with credentials', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'SecurePassword123!',
      });
    });
  });

  it('should validate minimum username length', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username.*at least 3 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate minimum password length', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password.*at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable submit button while loading', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should show error message on login failure', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should call onSwitchToRegister when register link clicked', () => {
    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const registerLink = screen.getByText(/don't have an account/i).closest('button');
    expect(registerLink).toBeInTheDocument();

    if (registerLink) {
      fireEvent.click(registerLink);
      expect(mockOnSwitchToRegister).toHaveBeenCalled();
    }
  });

  it('should clear error message when input changes', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Trigger error
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Change input to clear error
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });

    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });
  });

  it('should autofocus username input on mount', () => {
    render(<LoginForm onSubmit={mockOnSubmit} onSwitchToRegister={mockOnSwitchToRegister} />);

    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput).toHaveFocus();
  });
});
