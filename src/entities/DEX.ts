import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ArbitrageOpportunity } from './ArbitrageOpportunity';

export enum DEXType {
  UNISWAP_V2 = 'uniswap_v2',
  UNISWAP_V3 = 'uniswap_v3',
  PANCAKESWAP = 'pancakeswap',
  SUSHISWAP = 'sushiswap',
  QUICKSWAP = 'quickswap',
  CURVE = 'curve',
  BALANCER = 'balancer',
  DODO = 'dodo',
}

export enum DEXStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

/**
 * DEX entity for managing decentralized exchange information
 */
@Entity('dexes')
@Index(['network', 'status'])
@Index(['type'])
@Index(['isActive'])
export class DEX {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  symbol: string; // e.g., "UNI", "CAKE", "SUSHI"

  @Column({
    type: 'enum',
    enum: DEXType,
  })
  type: DEXType;

  @Column({ length: 10 })
  network: string; // eth, bsc, polygon

  @Column({ length: 42 })
  routerAddress: string;

  @Column({ length: 42 })
  factoryAddress: string;

  @Column({ length: 42, nullable: true })
  wethAddress: string; // Wrapped ETH/BNB/MATIC address

  @Column({
    type: 'enum',
    enum: DEXStatus,
    default: DEXStatus.ACTIVE,
  })
  status: DEXStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 6, scale: 4, default: 0.003 })
  feePercentage: number; // Trading fee (e.g., 0.3% = 0.003)

  @Column({ type: 'integer', default: 1 })
  priority: number; // Priority for arbitrage (1 = highest)

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  minLiquidity: string; // Minimum liquidity required for trading

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>; // DEX-specific configuration

  @Column({ type: 'jsonb', nullable: true })
  supportedTokens: string[]; // List of supported token addresses

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  documentation: string;

  @Column({ type: 'timestamp', nullable: true })
  lastHealthCheck: Date;

  @Column({ type: 'boolean', default: true })
  isHealthy: boolean;

  @Column({ type: 'text', nullable: true })
  healthCheckError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => ArbitrageOpportunity, opportunity => opportunity.dexA)
  opportunitiesAsA: ArbitrageOpportunity[];

  @OneToMany(() => ArbitrageOpportunity, opportunity => opportunity.dexB)
  opportunitiesAsB: ArbitrageOpportunity[];

  /**
   * Check if DEX is available for trading
   */
  isAvailable(): boolean {
    return this.isActive && 
           this.status === DEXStatus.ACTIVE && 
           this.isHealthy;
  }

  /**
   * Check if DEX supports a specific token
   */
  supportsToken(tokenAddress: string): boolean {
    if (!this.supportedTokens || this.supportedTokens.length === 0) {
      return true; // If no specific tokens listed, assume all are supported
    }
    return this.supportedTokens.includes(tokenAddress.toLowerCase());
  }

  /**
   * Get router ABI based on DEX type
   */
  getRouterABI(): string[] {
    // This would return the appropriate ABI for the router contract
    // For now, returning a placeholder - in real implementation, 
    // this would return the actual ABI array
    return [];
  }

  /**
   * Get factory ABI based on DEX type
   */
  getFactoryABI(): string[] {
    // This would return the appropriate ABI for the factory contract
    // For now, returning a placeholder - in real implementation, 
    // this would return the actual ABI array
    return [];
  }

  /**
   * Calculate adjusted fee for arbitrage calculations
   */
  getAdjustedFee(): number {
    // Some DEXes might have dynamic fees or fee tiers
    return this.feePercentage;
  }

  /**
   * Get DEX-specific configuration
   */
  getConfig(key: string, defaultValue?: any): any {
    if (!this.config) return defaultValue;
    return this.config[key] ?? defaultValue;
  }

  /**
   * Update health status
   */
  updateHealthStatus(isHealthy: boolean, error?: string): void {
    this.isHealthy = isHealthy;
    this.lastHealthCheck = new Date();
    this.healthCheckError = error || null;
  }

  /**
   * Enable/disable DEX
   */
  setActive(active: boolean): void {
    this.isActive = active;
    if (!active) {
      this.status = DEXStatus.INACTIVE;
    }
  }

  /**
   * Get display name with network
   */
  getDisplayName(): string {
    return `${this.name} (${this.network.toUpperCase()})`;
  }

  /**
   * Get summary for logging
   */
  getSummary(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      network: this.network,
      isActive: this.isActive,
      isHealthy: this.isHealthy,
      status: this.status,
      feePercentage: this.feePercentage,
      priority: this.priority,
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(): string[] {
    const errors: string[] = [];

    if (!this.routerAddress || this.routerAddress.length !== 42) {
      errors.push('Invalid router address');
    }

    if (!this.factoryAddress || this.factoryAddress.length !== 42) {
      errors.push('Invalid factory address');
    }

    if (this.feePercentage < 0 || this.feePercentage > 1) {
      errors.push('Fee percentage must be between 0 and 1');
    }

    if (this.priority < 1) {
      errors.push('Priority must be at least 1');
    }

    return errors;
  }
} 