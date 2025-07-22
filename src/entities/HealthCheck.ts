import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum HealthCheckType {
  DATABASE = 'database',
  BLOCKCHAIN_RPC = 'blockchain_rpc',
  TELEGRAM_API = 'telegram_api',
  DEX_API = 'dex_api',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  DISK_USAGE = 'disk_usage',
  NETWORK_LATENCY = 'network_latency',
  ARBITRAGE_ENGINE = 'arbitrage_engine',
  WEB_SERVER = 'web_server',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * HealthCheck entity for monitoring system health and performance
 */
@Entity('health_checks')
@Index(['type', 'status'])
@Index(['createdAt'])
@Index(['component'])
export class HealthCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: HealthCheckType,
  })
  type: HealthCheckType;

  @Column({ length: 50 })
  component: string; // Component name (e.g., 'ethereum-rpc', 'postgres')

  @Column({
    type: 'enum',
    enum: HealthStatus,
    default: HealthStatus.UNKNOWN,
  })
  status: HealthStatus;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  responseTime: number; // Response time in milliseconds

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  value: number; // Numeric value (e.g., CPU usage percentage)

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  errorDetails: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Check if health check is healthy
   */
  isHealthy(): boolean {
    return this.status === HealthStatus.HEALTHY;
  }

  /**
   * Check if health check has warning
   */
  hasWarning(): boolean {
    return this.status === HealthStatus.WARNING;
  }

  /**
   * Check if health check is critical
   */
  isCritical(): boolean {
    return this.status === HealthStatus.CRITICAL;
  }

  /**
   * Get status color for display
   */
  getStatusColor(): string {
    switch (this.status) {
      case HealthStatus.HEALTHY:
        return '🟢';
      case HealthStatus.WARNING:
        return '🟡';
      case HealthStatus.CRITICAL:
        return '🔴';
      default:
        return '⚪';
    }
  }

  /**
   * Get display message
   */
  getDisplayMessage(): string {
    const baseMessage = `${this.getStatusColor()} ${this.component}: ${this.status.toUpperCase()}`;
    
    if (this.responseTime) {
      return `${baseMessage} (${this.responseTime}ms)`;
    }
    
    if (this.value !== null && this.value !== undefined) {
      return `${baseMessage} (${this.value}%)`;
    }
    
    return baseMessage;
  }

  /**
   * Create a new health check record
   */
  static create(
    type: HealthCheckType,
    component: string,
    status: HealthStatus,
    options: {
      responseTime?: number;
      value?: number;
      message?: string;
      errorDetails?: string;
      metadata?: Record<string, any>;
    } = {}
  ): HealthCheck {
    const healthCheck = new HealthCheck();
    healthCheck.type = type;
    healthCheck.component = component;
    healthCheck.status = status;
    healthCheck.responseTime = options.responseTime;
    healthCheck.value = options.value;
    healthCheck.message = options.message;
    healthCheck.errorDetails = options.errorDetails;
    healthCheck.metadata = options.metadata;
    
    return healthCheck;
  }

  /**
   * Get summary for logging
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      component: this.component,
      status: this.status,
      responseTime: this.responseTime,
      value: this.value,
      message: this.message,
      timestamp: this.createdAt,
    };
  }
} 