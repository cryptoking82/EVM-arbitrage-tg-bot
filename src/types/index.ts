/**
 * Common type definitions for the Telegram Arbitrage Bot
 */

// Network types
export type NetworkName = 'eth' | 'bsc' | 'polygon';

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  currency: string;
  blockExplorer: string;
  gasPrice?: number;
  confirmations: number;
}

// Token types
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: NetworkName;
  isStablecoin?: boolean;
  isWrappedNative?: boolean;
}

// DEX types
export interface DEXInfo {
  name: string;
  symbol: string;
  routerAddress: string;
  factoryAddress: string;
  network: NetworkName;
  feePercentage: number;
  isActive: boolean;
}

// Arbitrage types
export interface ArbitrageParams {
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  amountIn: string;
  minProfitThreshold: string;
  maxSlippage: number;
  gasLimit: number;
}

export interface ArbitrageResult {
  success: boolean;
  transactionHash?: string;
  profit?: string;
  gasUsed?: string;
  error?: string;
}

export interface ArbitrageOpportunityData {
  id: string;
  tokenPair: string;
  network: NetworkName;
  dexA: string;
  dexB: string;
  profitPercentage: number;
  estimatedProfit: string;
  requiredAmount: string;
  detectedAt: Date;
  expiresAt?: Date;
}

// Price types
export interface PriceData {
  tokenAddress: string;
  price: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: Date;
}

// Transaction types
export interface TransactionData {
  hash: string;
  network: NetworkName;
  type: 'arbitrage' | 'swap' | 'transfer';
  status: 'pending' | 'confirmed' | 'failed';
  fromAddress: string;
  toAddress?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  timestamp: Date;
}

// Notification types
export interface NotificationData {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('telegram' | 'email' | 'sms')[];
}

// Health check types
export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime?: number;
  message?: string;
  timestamp: Date;
}

// Configuration types
export interface BotConfig {
  minProfitThreshold: number;
  maxSlippage: number;
  gasMultiplier: number;
  maxGasLimit: number;
  checkInterval: number;
  networks: NetworkName[];
  enabledFeatures: string[];
}

// User types
export interface UserData {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  isActive: boolean;
  lastActiveAt?: Date;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Statistics types
export interface StatisticsData {
  totalTrades: number;
  successfulTrades: number;
  totalProfit: string;
  averageProfit: string;
  bestTrade: string;
  successRate: number;
  networks: Record<NetworkName, {
    trades: number;
    profit: string;
  }>;
  timeframe: {
    start: Date;
    end: Date;
  };
}

// Error types
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

// Event types
export interface EventData {
  type: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
}

// Telegram specific types
export interface TelegramMessage {
  messageId: number;
  chatId: number;
  text: string;
  replyMarkup?: any;
  parseMode?: 'HTML' | 'Markdown';
}

export interface TelegramUser {
  id: number;
  isBot: boolean;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

// Smart contract types
export interface ContractConfig {
  address: string;
  network: NetworkName;
  abi: any[];
  deploymentBlock?: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  to: string;
  deadline: number;
}

// Monitoring types
export interface MonitoringMetrics {
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

// Log types
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  service: string;
  metadata?: Record<string, any>;
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
}

// Service status types
export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  lastRestart?: Date;
  health: HealthCheckResult;
}

// Export utility types
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>; 