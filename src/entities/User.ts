import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserSession } from './UserSession';
import { NotificationLog } from './NotificationLog';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

/**
 * User entity for managing Telegram users and access control
 */
@Entity('users')
@Index(['telegramId'], { unique: true })
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Column({ length: 100, nullable: true })
  username: string;

  @Column({ length: 100, nullable: true })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'inet', nullable: true })
  lastIpAddress: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserSession, session => session.user)
  sessions: UserSession[];

  @OneToMany(() => NotificationLog, notification => notification.user)
  notifications: NotificationLog[];

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user can execute commands
   */
  canExecuteCommands(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.USER;
  }

  /**
   * Check if user is active
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (this.isAdmin()) return true;
    return this.permissions?.includes(permission) || false;
  }

  /**
   * Get display name
   */
  getDisplayName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    if (this.firstName) {
      return this.firstName;
    }
    if (this.username) {
      return `@${this.username}`;
    }
    return `User ${this.telegramId}`;
  }

  /**
   * Update last activity
   */
  updateActivity(ipAddress?: string): void {
    this.lastActiveAt = new Date();
    if (ipAddress) {
      this.lastIpAddress = ipAddress;
    }
  }
} 