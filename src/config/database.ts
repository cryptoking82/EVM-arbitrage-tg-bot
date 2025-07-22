import { DataSource } from 'typeorm';
import { logger } from '../utils/logger';

// Import entities
import { User } from '../entities/User';
import { Transaction } from '../entities/Transaction';
import { ArbitrageOpportunity } from '../entities/ArbitrageOpportunity';
import { DEX } from '../entities/DEX';
import { Token } from '../entities/Token';
import { UserSession } from '../entities/UserSession';
import { NotificationLog } from '../entities/NotificationLog';
import { HealthCheck } from '../entities/HealthCheck';

/**
 * Database configuration and connection setup
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'arbitrage_user',
  password: process.env.DB_PASSWORD || 'secure_password',
  database: process.env.DB_DATABASE || 'arbitrage_bot',
  synchronize: process.env.NODE_ENV === 'development', // Only in development
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Transaction,
    ArbitrageOpportunity,
    DEX,
    Token,
    UserSession,
    NotificationLog,
    HealthCheck
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  extra: {
    max: 20, // Maximum number of connections
    min: 5,  // Minimum number of connections
    acquire: 30000, // Maximum time to wait for a connection
    idle: 10000, // Maximum time a connection can be idle
  },
});

/**
 * Initialize database connection with retry logic
 */
export async function initializeDatabase(): Promise<void> {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await AppDataSource.initialize();
      logger.info('✅ Database connection established successfully');
      return;
    } catch (error) {
      retryCount++;
      logger.error(`❌ Database connection attempt ${retryCount}/${maxRetries} failed:`, error);
      
      if (retryCount === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, retryCount) * 1000;
      logger.info(`⏳ Retrying database connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Close database connection gracefully
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('✅ Database connection closed successfully');
    }
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
    throw error;
  }
} 