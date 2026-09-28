import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Mock healthService for HomePage
vi.mock('../services/healthService', () => ({
  healthService: {
    checkBackendHealth: vi.fn().mockResolvedValue({
      success: true,
      data: {
        status: 'ok',
        version: '1.0.0',
        environment: 'test',
        timestamp: '2026-09-09T00:00:00Z',
        uptimeSeconds: 120,
        dependencies: {
          database: {
            status: 'connected',
            readyState: 1,
            retryCount: 0,
          },
        },
      },
    }),
  },
}));

// Mock catalogApi for HomePage and ProductsPage
vi.mock('../services/catalogApi', () => ({
  catalogApi: {
    getProducts: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    }),
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
    getBrands: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
  },
}));

describe('Route Shells & Pages', () => {
  it('renders HomePage with hero and empty catalog state', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Next-Generation AI E-Commerce Platform/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No featured products available yet')).toBeInTheDocument();
    });
  });

  it('renders ProductsPage with empty catalog state and filter bar', async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Product Catalog' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No products available')).toBeInTheDocument();
    });
  });

  it('renders NotFoundPage for unmatched routes', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return home/i })).toBeInTheDocument();
  });
});
