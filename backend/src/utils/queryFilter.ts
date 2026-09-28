/**
 * Reusable Query Filtering & Sanitization Utilities
 * Prevents NoSQL operator injection and constructs standardized Mongoose filter criteria.
 */

export interface RangeFilterOptions {
  min?: number | string;
  max?: number | string;
}

/**
 * Strips MongoDB operators starting with '$' to prevent NoSQL injection attacks.
 */
export function sanitizeQueryInput<T = any>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeQueryInput) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith('$')) {
      // Discard forbidden NoSQL injection operators
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeQueryInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Builds numeric range filter object { $gte?: min, $lte?: max }
 */
export function buildRangeFilter(options: RangeFilterOptions): Record<string, number> | undefined {
  const filter: Record<string, number> = {};

  if (options.min !== undefined && options.min !== '') {
    const minVal = Number(options.min);
    if (!isNaN(minVal)) {
      filter.$gte = minVal;
    }
  }

  if (options.max !== undefined && options.max !== '') {
    const maxVal = Number(options.max);
    if (!isNaN(maxVal)) {
      filter.$lte = maxVal;
    }
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Parses sort parameter string (e.g. 'price:asc', 'createdAt:desc', '-rating')
 */
export function parseSortParam(
  sortStr?: string,
  allowedFields: string[] = ['createdAt', 'price', 'rating', 'name']
): Record<string, 1 | -1> {
  if (!sortStr || typeof sortStr !== 'string') {
    return { createdAt: -1 };
  }

  let field: string;
  let direction: 1 | -1 = 1;

  if (sortStr.startsWith('-')) {
    field = sortStr.substring(1).trim();
    direction = -1;
  } else if (sortStr.includes(':')) {
    const [f, dir] = sortStr.split(':');
    field = f.trim();
    direction = dir.toLowerCase() === 'desc' ? -1 : 1;
  } else {
    field = sortStr.trim();
    direction = 1;
  }

  if (allowedFields.includes(field)) {
    return { [field]: direction };
  }

  return { createdAt: -1 };
}
