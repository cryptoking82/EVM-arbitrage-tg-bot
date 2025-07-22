import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format with timestamp and colors
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * Daily rotating file transport for general logs
 */
const fileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  format: logFormat,
});

/**
 * Daily rotating file transport for error logs
 */
const errorTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  level: 'error',
  format: logFormat,
});

/**
 * Daily rotating file transport for arbitrage operations
 */
const arbitrageTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'arbitrage-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  format: logFormat,
});

/**
 * Daily rotating file transport for telegram operations
 */
const telegramTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'telegram-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  format: logFormat,
});

/**
 * Main logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'arbitrage-bot' },
  transports: [
    fileTransport,
    errorTransport,
  ],
});

/**
 * Specialized logger for arbitrage operations
 */
export const arbitrageLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'arbitrage-engine' },
  transports: [
    arbitrageTransport,
    errorTransport,
  ],
});

/**
 * Specialized logger for telegram operations
 */
export const telegramLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'telegram-bot' },
  transports: [
    telegramTransport,
    errorTransport,
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
  });

  logger.add(consoleTransport);
  arbitrageLogger.add(consoleTransport);
  telegramLogger.add(consoleTransport);
}

/**
 * Log startup information
 */
logger.info('🔍 Logger initialized', {
  level: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
  logsDirectory: logsDir,
});

/**
 * Create child logger with additional metadata
 */
export function createChildLogger(metadata: Record<string, any>) {
  return logger.child(metadata);
}

/**
 * Performance logging utility
 */
export class PerformanceLogger {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    logger.info(`⏱️  Started: ${operation}`);
  }

  end(metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logger.info(`✅ Completed: ${this.operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  error(error: Error, metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logger.error(`❌ Failed: ${this.operation}`, {
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack,
      ...metadata,
    });
  }
} 