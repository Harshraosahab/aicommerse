import { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';
import { performanceTracker } from '../middleware/performanceTracker.js';
import { sendSuccess } from '../utils/response.js';

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<void> {
    const health = await HealthService.getHealth();
    // Return HTTP 200 so monitoring tools can read the full JSON payload
    sendSuccess(res, health, 200);
  }

  public static getLiveness(_req: Request, res: Response): void {
    const liveness = HealthService.getLiveness();
    sendSuccess(res, liveness, 200);
  }

  public static async getReadiness(_req: Request, res: Response): Promise<void> {
    const readiness = await HealthService.getReadiness();
    const statusCode = readiness.isReady ? 200 : 503;
    sendSuccess(res, readiness, statusCode);
  }

  public static getMetrics(_req: Request, res: Response): void {
    const metrics = performanceTracker.getMetrics();
    sendSuccess(res, metrics, 200);
  }
}

