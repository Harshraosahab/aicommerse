import { Request, Response, NextFunction } from 'express';
import { appCache } from '../utils/cache.js';

interface LatencyStats {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  recentMs: number[];
}

class PerformanceTracker {
  private startTime = Date.now();
  private statusCodes: Record<string, number> = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
  };

  private latencies: LatencyStats = {
    count: 0,
    totalMs: 0,
    minMs: Number.MAX_SAFE_INTEGER,
    maxMs: 0,
    recentMs: [],
  };

  private maxRecentSamples = 500;

  record(durationMs: number, statusCode: number): void {
    // 1. Latency metrics
    this.latencies.count++;
    this.latencies.totalMs += durationMs;
    if (durationMs < this.latencies.minMs) this.latencies.minMs = durationMs;
    if (durationMs > this.latencies.maxMs) this.latencies.maxMs = durationMs;

    this.latencies.recentMs.push(durationMs);
    if (this.latencies.recentMs.length > this.maxRecentSamples) {
      this.latencies.recentMs.shift();
    }

    // 2. Status code bucket
    if (statusCode >= 200 && statusCode < 300) {
      this.statusCodes['2xx']++;
    } else if (statusCode >= 300 && statusCode < 400) {
      this.statusCodes['3xx']++;
    } else if (statusCode >= 400 && statusCode < 500) {
      this.statusCodes['4xx']++;
    } else if (statusCode >= 500) {
      this.statusCodes['5xx']++;
    }
  }

  getMetrics(): {
    uptimeSeconds: number;
    requests: {
      total: number;
      byStatus: Record<string, number>;
      errorRatePercent: number;
    };
    latencyMs: {
      avg: number;
      p95: number;
      max: number;
      min: number;
    };
    cache: {
      size: number;
      hits: number;
      misses: number;
      hitRatio: number;
    };
    memoryUsageMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  } {
    const mem = process.memoryUsage();
    const totalRequests = this.latencies.count;
    const errorCount = (this.statusCodes['4xx'] || 0) + (this.statusCodes['5xx'] || 0);
    const errorRate = totalRequests > 0 ? Math.round((errorCount / totalRequests) * 1000) / 10 : 0;

    // Calculate P95 latency from recent samples
    let p95 = 0;
    if (this.latencies.recentMs.length > 0) {
      const sorted = [...this.latencies.recentMs].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.95);
      p95 = sorted[Math.min(idx, sorted.length - 1)];
    }

    const avg = totalRequests > 0 ? Math.round((this.latencies.totalMs / totalRequests) * 10) / 10 : 0;
    const min = this.latencies.minMs === Number.MAX_SAFE_INTEGER ? 0 : this.latencies.minMs;

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: totalRequests,
        byStatus: { ...this.statusCodes },
        errorRatePercent: errorRate,
      },
      latencyMs: {
        avg,
        p95,
        max: this.latencies.maxMs,
        min,
      },
      cache: appCache.getStats(),
      memoryUsageMb: {
        rss: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
        heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      },
    };
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Express middleware to record request duration and response code
 */
export function performanceMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceTracker.record(duration, res.statusCode);
  });

  next();
}
