import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { authApi } from '../services/authApi';

// Mock authApi
vi.mock('../services/authApi', () => ({
  authApi: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getAddresses: vi.fn(),
  },
}));

describe('Frontend Authentication Flow & Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders LoginPage with form inputs and calls login API on submit', async () => {
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      success: false,
      data: { user: null as any },
    });
    vi.mocked(authApi.login).mockResolvedValueOnce({
      success: true,
      data: {
        user: {
          _id: 'u1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'USER',
          addresses: [],
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'mock-token',
      },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Sign In to Your Account' })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'Secret123!',
      });
    });
  });

  it('renders RegisterPage and submits registration payload', async () => {
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      success: false,
      data: { user: null as any },
    });
    vi.mocked(authApi.register).mockResolvedValueOnce({
      success: true,
      data: {
        user: {
          _id: 'u2',
          name: 'Bob Jones',
          email: 'bob@example.com',
          role: 'USER',
          addresses: [],
          isActive: true,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'mock-token-2',
      },
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Create an Account' })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'Bob Jones' } });
    fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'Bob Jones',
        email: 'bob@example.com',
        password: 'Password123!',
        phone: undefined,
      });
    });
  });

  it('ProtectedRoute redirects unauthenticated users to /login', async () => {
    vi.mocked(authApi.getMe).mockRejectedValueOnce(new Error('Unauthenticated'));

    const ProtectedComponent = () => <div>Protected Secret Content</div>;
    const LoginMock = () => <div>Mock Login Screen</div>;

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProtectedComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginMock />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Login Screen')).toBeInTheDocument();
      expect(screen.queryByText('Protected Secret Content')).not.toBeInTheDocument();
    });
  });
});
