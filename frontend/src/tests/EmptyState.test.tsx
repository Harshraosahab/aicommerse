import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState Component', () => {
  it('renders title, description, and action button', () => {
    render(
      <EmptyState
        title="No items found"
        description="Please search for another item or adjust filters."
        action={<button>Reset Filters</button>}
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText(/please search for another item/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
  });
});
