import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * UserSession entity for managing user authentication sessions
 */
@Entity('user_sessions')
@Index(['token'], { unique: true })
@Index(['userId', 'status'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  token: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Check if session is valid (active and not expired)
   */
  isValid(): boolean {
    return this.status === SessionStatus.ACTIVE && 
           new Date() < this.expiresAt;
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }

  /**
   * Revoke session
   */
  revoke(): void {
    this.status = SessionStatus.REVOKED;
  }

  /**
   * Mark session as expired
   */
  markAsExpired(): void {
    this.status = SessionStatus.EXPIRED;
  }

  /**
   * Get session duration in milliseconds
   */
  getDuration(): number {
    if (!this.lastUsedAt) {
      return Date.now() - this.createdAt.getTime();
    }
    return this.lastUsedAt.getTime() - this.createdAt.getTime();
  }

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }
} 