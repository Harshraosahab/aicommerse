import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsPage } from '../pages/ProductsPage';
import { aiApi } from '../services/aiApi';

vi.mock('../services/aiApi', () => ({
  aiApi: {
    smartSearch: vi.fn(),
  },
}));

vi.mock('../services/catalogApi', () => ({
  catalogApi: {
    getProducts: vi.fn(),
    getCategories: vi.fn().mockResolvedValue({ success: true, data: { categories: [] } }),
    getBrands: vi.fn().mockResolvedValue({ success: true, data: { brands: [] } }),
    getSearchSuggestions: vi.fn().mockResolvedValue({ success: true, data: { products: [], categories: [], brands: [] } }),
  },
}));

describe('Smart Search & Intent Display Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Smart Search intent banner with extracted category and max price pills', async () => {
    vi.mocked(aiApi.smartSearch).mockResolvedValueOnce({
      success: true,
      data: {
        products: [
          {
            _id: 'p1',
            name: 'Speed Runner Pro',
            slug: 'speed-runner-pro',
            price: 2499,
            discount: 0,
            stock: 10,
            SKU: 'SHOE-01',
            tags: ['running'],
            images: [{ url: 'https://example.com/shoe.jpg', isPrimary: true }],
            isActive: true,
            isFeatured: false,
            isBestseller: false,
            isNewArrival: false,
            rating: 4.8,
            reviewCount: 15,
            specifications: [],
            attributes: [],
            variants: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        parsedIntent: {
          originalQuery: 'running shoes under 3000',
          cleanedQuery: 'running shoes',
          isNaturalLanguage: true,
          targetCategory: 'Footwear',
          targetBrand: null,
          maxPrice: 3000,
          minPrice: null,
          minRating: null,
          attributes: { type: 'running' },
        },
        appliedFilters: { price: { $lte: 3000 } },
        fallback: false,
        algorithm: 'hybrid_nlp_attribute_filtering',
      },
    });

    render(
      <MemoryRouter initialEntries={['/products?search=running%20shoes%20under%203000']}>
        <ProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('smart-search-intent-banner')).toBeInTheDocument();
      expect(screen.getByText(/Showing results for "running shoes"/i)).toBeInTheDocument();
      expect(screen.getByText(/Category: Footwear/i)).toBeInTheDocument();
      expect(screen.getByText(/Max: ₹3000/i)).toBeInTheDocument();
      expect(screen.getByText('Speed Runner Pro')).toBeInTheDocument();
    });
  });
});
