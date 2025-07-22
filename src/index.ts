import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { logger } from './utils/logger';
import { TelegramBot } from './services/telegram/bot';
import { WebServer } from './services/web/server';
import { ArbitrageEngine } from './services/arbitrage/engine';
import { HealthMonitor } from './services/monitoring/health';
import { NotificationService } from './services/notification/service';

// Load environment variables
dotenv.config();

/**
 * Main Application Class
 * Manages the lifecycle of all services and handles graceful shutdown
 */
class Application {
  private telegramBot: TelegramBot;
  private webServer: WebServer;
  private arbitrageEngine: ArbitrageEngine;
  private healthMonitor: HealthMonitor;
  private notificationService: NotificationService;

  constructor() {
    this.setupProcessHandlers();
  }

  /**
   * Initialize all application services
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Starting Telegram Arbitrage Bot...');

      // Initialize database connection
      await this.initializeDatabase();

      // Initialize core services
      await this.initializeServices();

      // Start all services
      await this.startServices();

      logger.info('✅ Application started successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      logger.info('📊 Connecting to database...');
      await AppDataSource.initialize();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
    logger.info('🔧 Initializing services...');

    // Initialize notification service first (other services depend on it)
    this.notificationService = new NotificationService();

    // Initialize telegram bot
    this.telegramBot = new TelegramBot(this.notificationService);

    // Initialize web server
    this.webServer = new WebServer();

    // Initialize arbitrage engine
    this.arbitrageEngine = new ArbitrageEngine(
      this.telegramBot,
      this.notificationService
    );

    // Initialize health monitor
    this.healthMonitor = new HealthMonitor([
      this.telegramBot,
      this.webServer,
      this.arbitrageEngine
    ]);

    logger.info('✅ Services initialized');
  }

  /**
   * Start all services
   */
  private async startServices(): Promise<void> {
    logger.info('🎯 Starting services...');

    // Start web server
    await this.webServer.start();

    // Start telegram bot
    await this.telegramBot.start();

    // Start arbitrage engine
    await this.arbitrageEngine.start();

    // Start health monitoring
    await this.healthMonitor.start();

    logger.info('✅ All services started');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Initiating graceful shutdown...');

    try {
      // Stop services in reverse order
      if (this.healthMonitor) {
        await this.healthMonitor.stop();
      }

      if (this.arbitrageEngine) {
        await this.arbitrageEngine.stop();
      }

      if (this.telegramBot) {
        await this.telegramBot.stop();
      }

      if (this.webServer) {
        await this.webServer.stop();
      }

      // Close database connection
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('📊 Database connection closed');
      }

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Setup process handlers for graceful shutdown
   */
  private setupProcessHandlers(): void {
    // Handle SIGTERM (Docker stop)
    process.on('SIGTERM', () => {
      logger.info('📨 Received SIGTERM signal');
      this.shutdown();
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('📨 Received SIGINT signal');
      this.shutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      this.shutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown();
    });
  }
}

// Start the application
const app = new Application();
app.initialize().catch((error) => {
  logger.error('💥 Application startup failed:', error);
  process.exit(1);
}); 