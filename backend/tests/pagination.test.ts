import { describe, it, expect } from 'vitest';
import {
  parsePaginationParams,
  calculatePagination,
} from '../src/utils/pagination.js';

describe('Pagination Utility Tests', () => {
  describe('parsePaginationParams', () => {
    it('applies default page and limit when query is empty', () => {
      const result = parsePaginationParams({});
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('correctly calculates skip for given page and limit', () => {
      const result = parsePaginationParams({ page: '3', limit: '15' });
      expect(result).toEqual({ page: 3, limit: 15, skip: 30 });
    });

    it('caps limit to maxLimit', () => {
      const result = parsePaginationParams({ page: 1, limit: 500 }, 20, 100);
      expect(result.limit).toBe(100);
    });

    it('handles negative or invalid input safely by defaulting', () => {
      const result = parsePaginationParams({ page: '-5', limit: 'invalid' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });
  });

  describe('calculatePagination', () => {
    it('returns empty pagination metadata when totalItems is 0', () => {
      const meta = calculatePagination(0, 1, 20);
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('calculates totalPages and next/prev indicators properly', () => {
      const meta = calculatePagination(55, 2, 20);
      expect(meta).toEqual({
        page: 2,
        limit: 20,
        totalItems: 55,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('identifies last page correctly (no next page)', () => {
      const meta = calculatePagination(55, 3, 20);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(true);
    });
  });
});
