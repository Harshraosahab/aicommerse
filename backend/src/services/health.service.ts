import os from 'os';
import { env } from '../config/env.js';
import { dbManager, DatabaseHealth } from '../config/database.js';
import { appCache } from '../utils/cache.js';

export interface HealthCheckResult {
  api: 'healthy' | 'degraded';
  database: DatabaseHealth['status'];
  status: 'ok' | 'degraded';
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsageMB: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuLoad: number[];
  };
  dependencies: {
    database: DatabaseHealth;
    aiService?: {
      status: 'connected' | 'unreachable' | 'disabled';
      url: string;
    };
    cache?: {
      status: 'operational';
      size: number;
      hitRate: string;
    };
  };
}

export class HealthService {
  /**
   * Kubernetes / Container liveness probe: verifies the node process is active and running.
   */
  public static getLiveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Kubernetes / Container readiness probe: verifies database connectivity and readiness to serve traffic.
   */
  public static async getReadiness() {
    const isDbAlive = await dbManager.ping();
    const readyState = dbManager.getHealth().readyState;
    const isReady = isDbAlive && readyState === 1;

    return {
      status: isReady ? 'ready' : 'not_ready',
      isReady,
      database: isReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Comprehensive health diagnostics including dependencies, memory, and cache telemetry.
   */
  public static async getHealth(): Promise<HealthCheckResult> {
    const mem = process.memoryUsage();
    const dbHealth = dbManager.getHealth();
    const cacheStats = appCache.getStats();

    // Check AI Service connectivity asynchronously without blocking
    let aiStatus: 'connected' | 'unreachable' | 'disabled' = 'disabled';
    if (env.AI_SERVICE_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(`${env.AI_SERVICE_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        aiStatus = res.ok ? 'connected' : 'unreachable';
      } catch {
        aiStatus = 'unreachable';
      }
    }

    // Overall status: Core service is degraded if DB is disconnected
    const isDegraded = dbHealth.status === 'disconnected' || dbHealth.status === 'disconnecting';

    return {
      api: isDegraded ? 'degraded' : 'healthy',
      database: dbHealth.status,
      status: isDegraded ? 'degraded' : 'ok',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMB: {
          rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
          heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
          heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
          external: Math.round((mem.external / 1024 / 1024) * 100) / 100,
        },
        cpuLoad: os.loadavg ? os.loadavg() : [0, 0, 0],
      },
      dependencies: {
        database: dbHealth,
        aiService: {
          status: aiStatus,
          url: env.AI_SERVICE_URL,
        },
        cache: {
          status: 'operational',
          size: cacheStats.size,
          hitRate: `${cacheStats.hitRatio.toFixed(1)}%`,
        },
      },
    };
  }
}
