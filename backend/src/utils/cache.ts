interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  /**
   * Retrieve item from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  /**
   * Store item in cache with TTL in seconds (default: 300s / 5min)
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete specific cache key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a given prefix (e.g. 'categories', 'products')
   */
  deletePrefix(prefix: string): number {
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * Purge expired entries to reclaim memory
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get telemetry stats
   */
  getStats(): { size: number; hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? Math.round((this.hits / total) * 1000) / 10 : 0,
    };
  }
}

// Global shared cache instance
export const appCache = new MemoryCache();
