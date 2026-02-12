import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';
import type { RegisterInput } from '@gemini-ui/shared';

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn<[RegisterInput], Promise<void>>();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnSwitchToLogin.mockClear();
  });

  it('should render register form', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should call onSubmit with valid credentials', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'SecurePassword123!',
      });
    });
  });

  it('should validate username minimum length', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username.*at least 3 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate password minimum length', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password.*at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate password confirmation match', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords.*do not match/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable submit button while loading', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should show error message on registration failure', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Username already exists'));

    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it('should call onSwitchToLogin when login link clicked', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const loginLink = screen.getByText(/already have an account/i).closest('button');
    expect(loginLink).toBeInTheDocument();

    if (loginLink) {
      fireEvent.click(loginLink);
      expect(mockOnSwitchToLogin).toHaveBeenCalled();
    }
  });

  it('should clear error message when input changes', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Username already exists'));

    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Trigger error
    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });

    // Change input to clear error
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });

    await waitFor(() => {
      expect(screen.queryByText(/username already exists/i)).not.toBeInTheDocument();
    });
  });

  it('should autofocus username input on mount', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput).toHaveFocus();
  });

  it('should enforce maximum username length', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const usernameInput = screen.getByLabelText(/username/i);
    const longUsername = 'a'.repeat(51);

    fireEvent.change(usernameInput, { target: { value: longUsername } });

    await waitFor(() => {
      expect(screen.getByText(/username.*at most 50 characters/i)).toBeInTheDocument();
    });
  });

  it('should enforce maximum password length', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} onSwitchToLogin={mockOnSwitchToLogin} />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const longPassword = 'a'.repeat(101);

    fireEvent.change(passwordInput, { target: { value: longPassword } });

    await waitFor(() => {
      expect(screen.getByText(/password.*at most 100 characters/i)).toBeInTheDocument();
    });
  });
});
