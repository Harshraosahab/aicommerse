import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '../components/catalog/ProductCard';
import { ProductSort } from '../components/catalog/ProductSort';
import { Pagination } from '../components/catalog/Pagination';
import { ProductFilter } from '../components/catalog/ProductFilter';
import { SearchBar } from '../components/catalog/SearchBar';
import { IProduct, ICategory, IBrand } from '../services/catalogApi';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ProductCard Component', () => {
  const mockProduct: IProduct = {
    _id: 'prod_123',
    name: 'Precision Mechanical Keyboard',
    slug: 'precision-mechanical-keyboard',
    description: 'A tactile mechanical keyboard with custom switches.',
    price: 129.99,
    compareAtPrice: 159.99,
    images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3', isPrimary: true }],
    category: { _id: 'cat_1', name: 'Keyboards', slug: 'keyboards' },
    brand: { _id: 'br_1', name: 'KeyChronix', slug: 'keychronix' },
    stock: 15,
    rating: 4.8,
    numReviews: 42,
    isFeatured: true,
    isNewArrival: true,
    isActive: true,
    tags: ['keyboard', 'mechanical'],
  };

  it('renders product name, price, discount badge, and stock status', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Precision Mechanical Keyboard')).toBeInTheDocument();
    expect(screen.getByText('$129.99')).toBeInTheDocument();
    expect(screen.getByText('$159.99')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders out of stock state accurately', () => {
    const outOfStockProduct: IProduct = {
      ...mockProduct,
      stock: 0,
    };
    renderWithRouter(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});

describe('ProductSort Component', () => {
  it('calls onChange when user selects a different option', () => {
    const handleSort = vi.fn();
    render(<ProductSort value="newest" onChange={handleSort} />);

    const select = screen.getByLabelText(/Sort by:/i);
    expect(select).toHaveValue('newest');

    fireEvent.change(select, { target: { value: 'price_asc' } });
    expect(handleSort).toHaveBeenCalledWith('price_asc');
  });
});

describe('Pagination Component', () => {
  it('renders correct page controls and emits page changes', () => {
    const handlePage = vi.fn();
    render(
      <Pagination
        metadata={{
          page: 2,
          totalPages: 5,
          totalItems: 50,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        }}
        onPageChange={handlePage}
      />
    );

    expect(screen.getByText(/50 items/i)).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'strong' })).toBeInTheDocument();

    const nextPageBtn = screen.getByRole('button', { name: /Go to next page/i });
    fireEvent.click(nextPageBtn);
    expect(handlePage).toHaveBeenCalledWith(3);

    const prevPageBtn = screen.getByRole('button', { name: /Go to previous page/i });
    fireEvent.click(prevPageBtn);
    expect(handlePage).toHaveBeenCalledWith(1);
  });

  it('does not render when totalPages <= 1', () => {
    const { container } = render(
      <Pagination
        metadata={{
          page: 1,
          totalPages: 1,
          totalItems: 5,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        }}
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('ProductFilter Component', () => {
  const categories: ICategory[] = [
    { _id: 'c1', name: 'Electronics', slug: 'electronics', isActive: true },
    { _id: 'c2', name: 'Accessories', slug: 'accessories', isActive: true },
  ];

  const brands: IBrand[] = [
    { _id: 'b1', name: 'Sony', slug: 'sony', isActive: true },
    { _id: 'b2', name: 'Logitech', slug: 'logitech', isActive: true },
  ];

  it('displays category and brand filters and triggers filter callbacks', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <ProductFilter
        categories={categories}
        brands={brands}
        selectedCategory=""
        selectedBrand=""
        minPrice={undefined}
        maxPrice={undefined}
        minRating={undefined}
        inStock={false}
        onFilterChange={handleFilterChange}
        onClearFilters={handleReset}
      />
    );

    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Brand/i)).toBeInTheDocument();

    // Select category dropdown
    const catSelect = screen.getByLabelText(/Category/i);
    fireEvent.change(catSelect, { target: { value: 'electronics' } });
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ category: 'electronics' }));

    const inStockToggle = screen.getByLabelText(/In Stock Only/i);
    fireEvent.click(inStockToggle);
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ inStock: true }));
  });
});

describe('SearchBar Component', () => {
  it('renders input and responds to query typing', async () => {
    const handleSearch = vi.fn();
    renderWithRouter(<SearchBar onSearch={handleSearch} placeholder="Search anything..." />);

    const input = screen.getByPlaceholderText('Search anything...');
    fireEvent.change(input, { target: { value: 'Mechanical' } });
    expect(input).toHaveValue('Mechanical');

    fireEvent.submit(input.closest('form')!);
    expect(handleSearch).toHaveBeenCalledWith('Mechanical');
  });
});
