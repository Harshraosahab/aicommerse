import { apiClient } from './apiClient';

export interface HealthResponsePayload {
  success: boolean;
  data: {
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
      };
    };
    dependencies: {
      database: {
        status: 'connected' | 'connecting' | 'disconnecting' | 'disconnected';
        readyState: number;
        retryCount: number;
      };
    };
  };
}

export const healthService = {
  async checkBackendHealth(): Promise<HealthResponsePayload> {
    return apiClient.get<HealthResponsePayload>('/health');
  },
};
