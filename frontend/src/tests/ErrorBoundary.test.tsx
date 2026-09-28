import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Simulated render error');
};

describe('ErrorBoundary Component', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Working Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Working Content')).toBeInTheDocument();
  });

  it('catches render errors and displays fallback error UI', () => {
    // Suppress console.error in test output for intentional error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Application Render Error')).toBeInTheDocument();
    expect(screen.getByText(/Simulated render error/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
