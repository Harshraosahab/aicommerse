import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Input } from '../components/ui/Input';

describe('Input Component', () => {
  it('renders input with label and links id properly', () => {
    render(<Input label="Email Address" id="email-field" />);
    const input = screen.getByLabelText(/email address/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'email-field');
  });

  it('renders error message and sets aria-invalid', () => {
    render(<Input label="Password" error="Password is required" />);
    const input = screen.getByLabelText(/password/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
  });

  it('handles user text input', () => {
    const handleChange = vi.fn();
    render(<Input label="Username" onChange={handleChange} />);
    const input = screen.getByLabelText(/username/i);
    fireEvent.change(input, { target: { value: 'johndoe' } });
    expect(handleChange).toHaveBeenCalled();
  });
});
