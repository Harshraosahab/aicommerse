import { describe, it, expect } from 'vitest';
import {
  sanitizeQueryInput,
  buildRangeFilter,
  parseSortParam,
} from '../src/utils/queryFilter.js';

describe('Query Filter & Sanitization Utilities', () => {
  describe('sanitizeQueryInput', () => {
    it('strips top-level MongoDB operator injection keys', () => {
      const malicious = {
        name: 'Headphones',
        $gt: '',
        $where: 'sleep(5000)',
      };
      const sanitized = sanitizeQueryInput(malicious);
      expect(sanitized).toEqual({ name: 'Headphones' });
      expect(sanitized).not.toHaveProperty('$gt');
      expect(sanitized).not.toHaveProperty('$where');
    });

    it('strips deeply nested operator injection keys', () => {
      const malicious = {
        filter: {
          category: 'electronics',
          $regex: '.*',
        },
      };
      const sanitized = sanitizeQueryInput(malicious);
      expect(sanitized).toEqual({
        filter: {
          category: 'electronics',
        },
      });
    });

    it('preserves arrays and primitives unchanged', () => {
      const safe = {
        tags: ['sale', 'popular'],
        inStock: true,
        price: 50,
      };
      expect(sanitizeQueryInput(safe)).toEqual(safe);
    });
  });

  describe('buildRangeFilter', () => {
    it('builds gte and lte filter when min and max are provided', () => {
      const filter = buildRangeFilter({ min: 10, max: 100 });
      expect(filter).toEqual({ $gte: 10, $lte: 100 });
    });

    it('builds only gte when only min is provided', () => {
      const filter = buildRangeFilter({ min: '25' });
      expect(filter).toEqual({ $gte: 25 });
    });

    it('returns undefined when no valid boundaries are passed', () => {
      expect(buildRangeFilter({})).toBeUndefined();
      expect(buildRangeFilter({ min: '', max: '' })).toBeUndefined();
    });
  });

  describe('parseSortParam', () => {
    it('parses ascending sort param', () => {
      expect(parseSortParam('price:asc')).toEqual({ price: 1 });
    });

    it('parses descending sort param with prefix notation', () => {
      expect(parseSortParam('-rating')).toEqual({ rating: -1 });
    });

    it('defaults to createdAt descending when field is not allowed or missing', () => {
      expect(parseSortParam('unauthorizedField:asc')).toEqual({ createdAt: -1 });
      expect(parseSortParam(undefined)).toEqual({ createdAt: -1 });
    });
  });
});
