import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  ARBITRAGE_OPPORTUNITY = 'arbitrage_opportunity',
  TRADE_EXECUTED = 'trade_executed',
  SYSTEM_ALERT = 'system_alert',
}

export enum NotificationChannel {
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

/**
 * NotificationLog entity for tracking sent notifications
 */
@Entity('notification_logs')
@Index(['userId', 'type'])
@Index(['channel', 'status'])
@Index(['createdAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  recipient: string; // Email, phone number, or chat ID

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.notifications, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Check if notification was successfully sent
   */
  isSuccessful(): boolean {
    return this.status === NotificationStatus.SENT || 
           this.status === NotificationStatus.DELIVERED;
  }

  /**
   * Check if notification failed
   */
  isFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  /**
   * Mark notification as sent
   */
  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
  }

  /**
   * Mark notification as delivered
   */
  markAsDelivered(): void {
    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  /**
   * Mark notification as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = NotificationStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  /**
   * Increment retry count
   */
  incrementRetry(): void {
    this.retryCount++;
  }

  /**
   * Get delivery time in milliseconds
   */
  getDeliveryTime(): number | null {
    if (!this.sentAt || !this.deliveredAt) return null;
    return this.deliveredAt.getTime() - this.sentAt.getTime();
  }

  /**
   * Get processing time in milliseconds
   */
  getProcessingTime(): number | null {
    if (!this.sentAt) return null;
    return this.sentAt.getTime() - this.createdAt.getTime();
  }
} 