import { app } from './app.js';
import { env } from './config/env.js';
import { dbManager } from './config/database.js';
import { logger } from './utils/logger.js';
import http from 'http';

let server: http.Server | null = null;

async function startServer(): Promise<void> {
  try {
    console.log(`[STARTUP] Loading environment (${env.NODE_ENV})`);
    logger.info('Starting Nexus Commerce Backend Service...', {
      environment: env.NODE_ENV,
      port: env.PORT,
    });

    console.log('[STARTUP] Connecting to MongoDB...');
    // Initiate MongoDB connection in background with retries
    // We don't block server startup so health checks can report connectivity status
    dbManager.connect().catch((err) => {
      logger.error('Failed to establish initial MongoDB connection', { error: err.message });
    });

    server = app.listen(env.PORT, () => {
      console.log(`[SERVER] API listening on http://localhost:${env.PORT}`);
      console.log(`[HEALTH] Health check available at http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`Backend API server running on http://localhost:${env.PORT}`);
      logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[SERVER] Port ${env.PORT} is already in use by another process.`);
        console.error(`[SERVER] Please terminate the existing process or change PORT in .env.`);
      } else {
        console.error(`[SERVER] Server error: ${err.message}`);
      }
      process.exit(1);
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await dbManager.disconnect();
          logger.info('Cleanup complete. Process exiting gracefully.');
          process.exit(0);
        });

        // Force shutdown after 10s if connections fail to drain
        setTimeout(() => {
          logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
          process.exit(1);
        }, 10000).unref();
      } else {
        await dbManager.disconnect();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Promise Rejection detected', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception detected. Initiating emergency shutdown.', {
        error: err.message,
        stack: err.stack,
      });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('Failed to start backend server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
