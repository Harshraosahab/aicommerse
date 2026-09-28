import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';

vi.mock('../services/catalogApi', () => ({
  catalogApi: {
    getProducts: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    }),
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      data: { categories: [] },
    }),
    getBrands: vi.fn().mockResolvedValue({
      success: true,
      data: { brands: [] },
    }),
  },
}));

vi.mock('../services/healthService', () => ({
  healthService: {
    checkBackendHealth: vi.fn().mockResolvedValue({
      success: true,
      data: { status: 'ok', uptimeSeconds: 100 },
    }),
  },
}));

vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(() => ({
    cart: null,
    wishlist: null,
    cartCount: 0,
    wishlistCount: 0,
    isLoading: false,
    error: null,
  })),
}));

const VIEWPORTS = [
  { name: 'Mobile Small', width: 320 },
  { name: 'Mobile Medium', width: 375 },
  { name: 'Mobile Standard (iPhone)', width: 390 },
  { name: 'Mobile Plus/Max', width: 414 },
  { name: 'Tablet / Medium', width: 768 },
  { name: 'Desktop Small', width: 1024 },
  { name: 'Desktop Large', width: 1440 },
];

describe('Responsive Viewport Verification (320px - 1440px)', () => {
  VIEWPORTS.forEach(({ name, width }) => {
    describe(`Viewport: ${name} (${width}px)`, () => {
      it(`renders Header correctly at ${width}px without crashing`, () => {
        window.innerWidth = width;
        window.dispatchEvent(new Event('resize'));

        render(
          <MemoryRouter>
            <Header />
          </MemoryRouter>
        );

        // Verify brand logo and core action controls exist
        expect(screen.getByLabelText(/nexus commerce home/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/toggle navigation menu/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/shopping cart/i)).toBeInTheDocument();
      });

      it(`renders HomePage at ${width}px with accessible landmarks`, () => {
        window.innerWidth = width;
        window.dispatchEvent(new Event('resize'));

        render(
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        );

        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText(/Phase 1 • Production Architecture Foundation/i)).toBeInTheDocument();
      });

      it(`renders ProductsPage empty state at ${width}px`, async () => {
        window.innerWidth = width;
        window.dispatchEvent(new Event('resize'));

        render(
          <MemoryRouter>
            <ProductsPage />
          </MemoryRouter>
        );

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Product Catalog');
        await waitFor(() => {
          expect(screen.getByText('No products available')).toBeInTheDocument();
        });
      });

      it(`renders AdminDashboardPage at ${width}px`, () => {
        window.innerWidth = width;
        window.dispatchEvent(new Event('resize'));

        render(
          <MemoryRouter>
            <AdminDashboardPage />
          </MemoryRouter>
        );

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Admin Control Center');
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
      });
    });
  });
});
