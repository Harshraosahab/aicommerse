import { apiClient } from './apiClient';

export interface IProductImage {
  _id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface IProductAttribute {
  name: string;
  value: string;
}

export interface IProductVariant {
  _id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: IProductAttribute[];
}

export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: { _id: string; name: string; slug: string } | string | null;
  isActive: boolean;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: IBrand | null;
  category: ICategory;
  subcategory?: ICategory | null;
  images: IProductImage[];
  price: number;
  compareAtPrice?: number;
  discount: number;
  stock: number;
  SKU: string;
  tags: string[];
  specifications: IProductAttribute[];
  attributes: IProductAttribute[];
  variants: IProductVariant[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedProductsResponse {
  success: boolean;
  data: IProduct[];
  pagination: PaginationMetadata;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'reviews' | 'discount';
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: {
    products: { name: string; slug: string }[];
    categories: { name: string; slug: string }[];
    brands: { name: string; slug: string }[];
  };
}

export const catalogApi = {
  // Product endpoints
  getProducts: (params: ProductQueryParams = {}) =>
    apiClient.get<PaginatedProductsResponse>('/products', { params: params as any }),

  getProductBySlug: (slug: string) =>
    apiClient.get<{ success: boolean; data: { product: IProduct } }>(`/products/${slug}`),

  getRelatedProducts: (slug: string) =>
    apiClient.get<{ success: boolean; data: { products: IProduct[] } }>(`/products/${slug}/related`),

  getSearchSuggestions: (q: string) =>
    apiClient.get<SearchSuggestionsResponse>('/products/suggestions', { params: { q } }),

  // Category endpoints
  getCategories: () =>
    apiClient.get<{ success: boolean; data: { categories: ICategory[] } }>('/categories'),

  getCategoryBySlug: (slug: string) =>
    apiClient.get<{ success: boolean; data: { category: ICategory; subcategories: ICategory[] } }>(`/categories/${slug}`),

  // Brand endpoints
  getBrands: () =>
    apiClient.get<{ success: boolean; data: { brands: IBrand[] } }>('/brands'),

  getBrandBySlug: (slug: string) =>
    apiClient.get<{ success: boolean; data: { brand: IBrand } }>(`/brands/${slug}`),
};
