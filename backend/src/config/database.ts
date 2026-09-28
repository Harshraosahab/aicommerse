import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export interface DatabaseHealth {
  status: 'connected' | 'connecting' | 'disconnecting' | 'disconnected';
  readyState: number;
  host?: string;
  name?: string;
  retryCount: number;
  lastError?: string;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnecting: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 5;
  private retryDelayMs: number = 2000;
  private isShuttingDown: boolean = false;
  private lastError?: string;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private sanitizeErrorMessage(msg?: string): string {
    if (!msg) return 'Unknown database error';
    // Redact password from connection strings if present
    return msg.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.retryCount = 0;
      this.lastError = undefined;
      console.log(`[DATABASE] MongoDB connected successfully (${mongoose.connection.host || 'active'})`);
      logger.info('MongoDB connection established successfully', {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      });
    });

    mongoose.connection.on('error', (err) => {
      const safeMsg = this.sanitizeErrorMessage(err.message);
      this.lastError = safeMsg;
      console.error(`[DATABASE] MongoDB connection error: ${safeMsg}`);
      logger.error('MongoDB connection error occurred', {
        error: safeMsg,
        stack: err.stack,
      });
    });

    mongoose.connection.on('disconnected', () => {
      if (!this.isShuttingDown) {
        console.warn('[DATABASE] MongoDB disconnected. Attempting reconnection...');
        logger.warn('MongoDB disconnected. Attempting reconnection...');
      }
    });

    mongoose.connection.on('reconnected', () => {
      this.lastError = undefined;
      console.log('[DATABASE] MongoDB successfully reconnected');
      logger.info('MongoDB successfully reconnected');
    });
  }

  public async connect(): Promise<void> {
    if (mongoose.connection.readyState === 1 || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    while (this.retryCount < this.maxRetries && !this.isShuttingDown) {
      try {
        console.log(`[DATABASE] Connecting to MongoDB... (Attempt ${this.retryCount + 1}/${this.maxRetries})`);
        logger.info(`Connecting to MongoDB... (Attempt ${this.retryCount + 1}/${this.maxRetries})`);
        await mongoose.connect(env.MONGODB_URI, {
          maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
          minPoolSize: env.MONGODB_MIN_POOL_SIZE,
          maxIdleTimeMS: env.MONGODB_MAX_IDLE_TIME_MS,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        });
        this.isConnecting = false;
        this.lastError = undefined;
        return;
      } catch (err: any) {
        this.retryCount++;
        this.isConnecting = false;
        const safeError = this.sanitizeErrorMessage(err.message);
        this.lastError = safeError;
        console.error(`[DATABASE] MongoDB connection attempt ${this.retryCount} failed: ${safeError}`);
        logger.error(`MongoDB connection attempt ${this.retryCount} failed`, {
          error: safeError,
        });

        if (this.retryCount >= this.maxRetries) {
          console.warn('[DATABASE] MongoDB max connection retries reached. Backend running in DEGRADED mode.');
          console.warn('[DATABASE] Cause: Unable to reach MongoDB at the configured URI.');
          console.warn('[DATABASE] Please ensure MongoDB is started or configure MONGODB_URI in backend/.env.');
          logger.error('MongoDB max connection retries reached. Service starting in degraded mode.');
          return;
        }

        const delay = this.retryDelayMs * Math.pow(1.5, this.retryCount - 1);
        console.log(`[DATABASE] Waiting ${Math.round(delay)}ms before reconnecting to MongoDB...`);
        logger.info(`Waiting ${Math.round(delay)}ms before reconnecting to MongoDB...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.isShuttingDown = true;
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected cleanly during shutdown');
      }
    } catch (err: any) {
      logger.error('Error disconnecting from MongoDB', { error: err.message });
    }
  }

  public async ping(): Promise<boolean> {
    try {
      if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        return false;
      }
      const adminDb = mongoose.connection.db.admin();
      const pingResult = await adminDb.ping();
      return !!pingResult?.ok;
    } catch {
      return false;
    }
  }

  public getHealth(): DatabaseHealth {
    const readyState = mongoose.connection.readyState;
    const statusMap: Record<number, DatabaseHealth['status']> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: statusMap[readyState] || 'disconnected',
      readyState,
      host: mongoose.connection.host || undefined,
      name: mongoose.connection.name || undefined,
      retryCount: this.retryCount,
      lastError: this.lastError,
    };
  }
}

export const dbManager = DatabaseManager.getInstance();
