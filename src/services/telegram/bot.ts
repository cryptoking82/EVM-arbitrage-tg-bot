import { Telegraf, Context, Scenes, session } from 'telegraf';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { telegramLogger as logger } from '../../utils/logger';
import { UserService } from '../user/service';
import { NotificationService } from '../notification/service';
import { CommandHandler } from './commands';
import { MenuHandler } from './menus';
import { MiddlewareHandler } from './middleware';
import { User, UserRole } from '../../entities/User';

export interface TelegramContext extends Context {
  user?: User;
  scene: Scenes.SceneContextScene<TelegramContext>;
  session: {
    [key: string]: any;
  };
}

/**
 * Telegram Bot Service
 * Handles all Telegram bot operations, commands, and user interactions
 */
export class TelegramBot {
  private bot: Telegraf<TelegramContext>;
  private userService: UserService;
  private commandHandler: CommandHandler;
  private menuHandler: MenuHandler;
  private middlewareHandler: MiddlewareHandler;
  private rateLimiter: RateLimiterMemory;
  private isRunning: boolean = false;

  constructor(private notificationService: NotificationService) {
    // Initialize bot
    this.bot = new Telegraf<TelegramContext>(process.env.TELEGRAM_BOT_TOKEN!);
    
    // Initialize services
    this.userService = new UserService();
    this.commandHandler = new CommandHandler(this.userService, this.notificationService);
    this.menuHandler = new MenuHandler(this.userService);
    this.middlewareHandler = new MiddlewareHandler(this.userService);
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: 'telegram_bot',
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30'),
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000,
    });

    this.setupBot();
  }

  /**
   * Setup bot with middleware, commands, and scenes
   */
  private setupBot(): void {
    try {
      // Setup session management
      this.bot.use(session());

      // Setup custom middleware
      this.bot.use(this.middlewareHandler.rateLimitMiddleware(this.rateLimiter));
      this.bot.use(this.middlewareHandler.userMiddleware());
      this.bot.use(this.middlewareHandler.authMiddleware());
      this.bot.use(this.middlewareHandler.loggingMiddleware());

      // Setup scenes
      const stage = new Scenes.Stage<TelegramContext>([]);
      this.bot.use(stage.middleware());

      // Setup commands
      this.setupCommands();

      // Setup menu handlers
      this.setupMenuHandlers();

      // Setup error handling
      this.setupErrorHandling();

      logger.info('✅ Telegram bot setup completed');
    } catch (error) {
      logger.error('❌ Failed to setup Telegram bot:', error);
      throw error;
    }
  }

  /**
   * Setup bot commands
   */
  private setupCommands(): void {
    // Public commands (available to all users)
    this.bot.start(this.commandHandler.start.bind(this.commandHandler));
    this.bot.help(this.commandHandler.help.bind(this.commandHandler));
    this.bot.command('status', this.commandHandler.status.bind(this.commandHandler));
    this.bot.command('stats', this.commandHandler.stats.bind(this.commandHandler));
    this.bot.command('menu', this.commandHandler.menu.bind(this.commandHandler));

    // Admin-only commands
    this.bot.command('admin', this.commandHandler.admin.bind(this.commandHandler));
    this.bot.command('users', this.commandHandler.listUsers.bind(this.commandHandler));
    this.bot.command('health', this.commandHandler.health.bind(this.commandHandler));
    this.bot.command('logs', this.commandHandler.logs.bind(this.commandHandler));
    this.bot.command('settings', this.commandHandler.settings.bind(this.commandHandler));
    
    // Arbitrage commands
    this.bot.command('opportunities', this.commandHandler.opportunities.bind(this.commandHandler));
    this.bot.command('trades', this.commandHandler.trades.bind(this.commandHandler));
    this.bot.command('profit', this.commandHandler.profit.bind(this.commandHandler));
    this.bot.command('networks', this.commandHandler.networks.bind(this.commandHandler));

    // Control commands
    this.bot.command('start_arbitrage', this.commandHandler.startArbitrage.bind(this.commandHandler));
    this.bot.command('stop_arbitrage', this.commandHandler.stopArbitrage.bind(this.commandHandler));
    this.bot.command('pause', this.commandHandler.pauseArbitrage.bind(this.commandHandler));
    this.bot.command('resume', this.commandHandler.resumeArbitrage.bind(this.commandHandler));

    logger.info('📝 Bot commands setup completed');
  }

  /**
   * Setup menu and callback query handlers
   */
  private setupMenuHandlers(): void {
    // Main menu callbacks
    this.bot.action('main_menu', this.menuHandler.mainMenu.bind(this.menuHandler));
    this.bot.action('arbitrage_menu', this.menuHandler.arbitrageMenu.bind(this.menuHandler));
    this.bot.action('admin_menu', this.menuHandler.adminMenu.bind(this.menuHandler));
    this.bot.action('settings_menu', this.menuHandler.settingsMenu.bind(this.menuHandler));
    this.bot.action('stats_menu', this.menuHandler.statsMenu.bind(this.menuHandler));

    // Arbitrage controls
    this.bot.action(/^arbitrage_(start|stop|pause|resume)$/, this.menuHandler.arbitrageControl.bind(this.menuHandler));
    
    // Network selection
    this.bot.action(/^network_(eth|bsc|polygon)$/, this.menuHandler.networkSelect.bind(this.menuHandler));
    
    // Settings callbacks
    this.bot.action(/^setting_/, this.menuHandler.settingSelect.bind(this.menuHandler));
    
    // Pagination callbacks
    this.bot.action(/^page_\d+$/, this.menuHandler.pagination.bind(this.menuHandler));

    // Generic callback handler for unhandled callbacks
    this.bot.on('callback_query', this.menuHandler.handleCallback.bind(this.menuHandler));

    logger.info('🎛️ Menu handlers setup completed');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.bot.catch((err, ctx) => {
      logger.error('Telegram bot error:', {
        error: err.message,
        stack: err.stack,
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
        updateType: ctx.updateType,
      });

      // Send error message to user if possible
      if (ctx.chat) {
        ctx.reply('❌ An error occurred while processing your request. Please try again later.')
          .catch(replyErr => logger.error('Failed to send error message:', replyErr));
      }

      // Notify admin of critical errors
      this.notificationService.sendTelegramAlert(
        '🚨 Bot Error',
        `An error occurred in the Telegram bot:\n\n${err.message}\n\nUser: ${ctx.from?.id}\nChat: ${ctx.chat?.id}`,
        { error: err.message, stack: err.stack }
      );
    });

    logger.info('🛡️ Error handling setup completed');
  }

  /**
   * Start the Telegram bot
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        logger.warn('Bot is already running');
        return;
      }

      // Start bot polling
      await this.bot.launch();
      this.isRunning = true;

      // Get bot info
      const botInfo = await this.bot.telegram.getMe();
      logger.info('🤖 Telegram bot started successfully', {
        username: botInfo.username,
        id: botInfo.id,
        firstName: botInfo.first_name,
      });

      // Send startup notification to admin
      await this.notificationService.sendTelegramNotification(
        '🚀 Bot Started',
        `Telegram arbitrage bot is now online and ready to receive commands.\n\nBot: @${botInfo.username}`,
        { botInfo }
      );

      // Enable graceful stop
      process.once('SIGINT', () => this.stop());
      process.once('SIGTERM', () => this.stop());

    } catch (error) {
      logger.error('❌ Failed to start Telegram bot:', error);
      throw error;
    }
  }

  /**
   * Stop the Telegram bot
   */
  async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        logger.warn('Bot is not running');
        return;
      }

      logger.info('🛑 Stopping Telegram bot...');
      await this.bot.stop();
      this.isRunning = false;

      logger.info('✅ Telegram bot stopped successfully');
    } catch (error) {
      logger.error('❌ Error stopping Telegram bot:', error);
      throw error;
    }
  }

  /**
   * Send message to specific chat
   */
  async sendMessage(chatId: number | string, message: string, options?: any): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      });
    } catch (error) {
      logger.error('Failed to send Telegram message:', {
        chatId,
        message: message.substring(0, 100),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send message to admin chat
   */
  async sendAdminMessage(message: string, options?: any): Promise<void> {
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!adminChatId) {
      logger.warn('Admin chat ID not configured');
      return;
    }

    await this.sendMessage(adminChatId, message, options);
  }

  /**
   * Broadcast message to all active users
   */
  async broadcast(message: string, options?: any): Promise<void> {
    try {
      const activeUsers = await this.userService.getActiveUsers();
      const results = await Promise.allSettled(
        activeUsers.map(user => 
          this.sendMessage(user.telegramId, message, options)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info('📢 Broadcast completed', {
        total: activeUsers.length,
        successful,
        failed,
      });

    } catch (error) {
      logger.error('❌ Broadcast failed:', error);
      throw error;
    }
  }

  /**
   * Check if bot is running
   */
  isAlive(): boolean {
    return this.isRunning;
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<any> {
    try {
      return await this.bot.telegram.getMe();
    } catch (error) {
      logger.error('Failed to get bot info:', error);
      throw error;
    }
  }

  /**
   * Health check for the bot
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const botInfo = await this.getBotInfo();
      return {
        healthy: this.isRunning,
        details: {
          running: this.isRunning,
          botId: botInfo.id,
          username: botInfo.username,
          canJoinGroups: botInfo.can_join_groups,
          canReadAllGroupMessages: botInfo.can_read_all_group_messages,
          supportsInlineQueries: botInfo.supports_inline_queries,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          running: this.isRunning,
          error: error.message,
        },
      };
    }
  }

  /**
   * Get bot statistics
   */
  getStats(): Record<string, any> {
    return {
      isRunning: this.isRunning,
      rateLimiter: {
        points: this.rateLimiter.points,
        duration: this.rateLimiter.duration,
      },
    };
  }
} 