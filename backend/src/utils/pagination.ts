import { Query } from 'mongoose';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  maxLimit?: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export function parsePaginationParams(
  query: Record<string, any> = {},
  defaultLimit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number; skip: number } {
  let page = parseInt(String(query.page), 10);
  let limit = parseInt(String(query.limit), 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function calculatePagination(
  totalItems: number,
  page: number,
  limit: number
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit) || 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1 && totalPages > 0;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

export async function paginateQuery<T>(
  query: Query<T[], any>,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<T>> {
  const { defaultLimit = 20, maxLimit = 100 } = { defaultLimit: 20, maxLimit: options.maxLimit || 100 };
  const { page, limit, skip } = parsePaginationParams(options, defaultLimit, maxLimit);

  // Clone query to count total matching documents without pagination offsets
  const countQuery = query.model.find(query.getQuery()).countDocuments();

  const [totalItems, items] = await Promise.all([
    countQuery.exec(),
    query.skip(skip).limit(limit).exec(),
  ]);

  const pagination = calculatePagination(totalItems, page, limit);

  return {
    items: items || [],
    pagination,
  };
}
