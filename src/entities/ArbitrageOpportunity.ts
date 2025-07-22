import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './Transaction';
import { Token } from './Token';
import { DEX } from './DEX';

export enum OpportunityStatus {
  DETECTED = 'detected',
  ANALYZING = 'analyzing',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * ArbitrageOpportunity entity for tracking arbitrage opportunities
 */
@Entity('arbitrage_opportunities')
@Index(['status'])
@Index(['network'])
@Index(['tokenPair'])
@Index(['profitPercentage'])
@Index(['createdAt'])
export class ArbitrageOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10 })
  network: string; // eth, bsc, polygon

  @Column({ length: 20 })
  tokenPair: string; // e.g., "ETH/USDC"

  @Column({ length: 42 })
  tokenA: string; // Token A address

  @Column({ length: 42 })
  tokenB: string; // Token B address

  @Column({ length: 42 })
  dexAAddress: string; // First DEX address

  @Column({ length: 42 })
  dexBAddress: string; // Second DEX address

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  priceA: string; // Price on DEX A

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  priceB: string; // Price on DEX B

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  profitPercentage: number;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  estimatedProfit: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  requiredAmount: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  estimatedGasFee: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  actualProfit: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  actualGasFee: string;

  @Column({
    type: 'enum',
    enum: OpportunityStatus,
    default: OpportunityStatus.DETECTED,
  })
  status: OpportunityStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  detectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Transaction, transaction => transaction.opportunity)
  transactions: Transaction[];

  @ManyToOne(() => Token, { nullable: true })
  @JoinColumn({ name: 'tokenA' })
  tokenAInfo: Token;

  @ManyToOne(() => Token, { nullable: true })
  @JoinColumn({ name: 'tokenB' })
  tokenBInfo: Token;

  @ManyToOne(() => DEX, { nullable: true })
  @JoinColumn({ name: 'dexAAddress' })
  dexA: DEX;

  @ManyToOne(() => DEX, { nullable: true })
  @JoinColumn({ name: 'dexBAddress' })
  dexB: DEX;

  /**
   * Check if opportunity is profitable
   */
  isProfitable(): boolean {
    return this.profitPercentage > 0;
  }

  /**
   * Check if opportunity is still valid (not expired)
   */
  isValid(): boolean {
    if (!this.expiresAt) return true;
    return new Date() < this.expiresAt;
  }

  /**
   * Check if opportunity was executed successfully
   */
  isSuccessful(): boolean {
    return this.status === OpportunityStatus.COMPLETED && parseFloat(this.actualProfit || '0') > 0;
  }

  /**
   * Calculate profit after gas fees
   */
  getNetProfit(): string {
    if (!this.actualProfit || !this.actualGasFee) {
      return '0';
    }
    
    const profit = parseFloat(this.actualProfit);
    const gasFee = parseFloat(this.actualGasFee);
    
    return Math.max(0, profit - gasFee).toString();
  }

  /**
   * Calculate actual profit percentage
   */
  getActualProfitPercentage(): number {
    if (!this.actualProfit || !this.requiredAmount) {
      return 0;
    }
    
    const profit = parseFloat(this.actualProfit);
    const amount = parseFloat(this.requiredAmount);
    
    if (amount === 0) return 0;
    
    return (profit / amount) * 100;
  }

  /**
   * Get profit in USD (if metadata contains USD rates)
   */
  getProfitUSD(): number | null {
    const netProfit = this.getNetProfit();
    if (!netProfit || !this.metadata?.usdRate) {
      return null;
    }
    return parseFloat(netProfit) * this.metadata.usdRate;
  }

  /**
   * Mark opportunity as executing
   */
  markAsExecuting(): void {
    this.status = OpportunityStatus.EXECUTING;
    this.executedAt = new Date();
  }

  /**
   * Mark opportunity as completed
   */
  markAsCompleted(actualProfit: string, actualGasFee: string): void {
    this.status = OpportunityStatus.COMPLETED;
    this.actualProfit = actualProfit;
    this.actualGasFee = actualGasFee;
    this.completedAt = new Date();
  }

  /**
   * Mark opportunity as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = OpportunityStatus.FAILED;
    this.errorMessage = errorMessage;
  }

  /**
   * Mark opportunity as expired
   */
  markAsExpired(): void {
    this.status = OpportunityStatus.EXPIRED;
  }

  /**
   * Get summary for logging/notification
   */
  getSummary(): string {
    const netProfit = this.getNetProfit();
    return `${this.tokenPair} on ${this.network}: ${this.profitPercentage.toFixed(2)}% profit (${netProfit} tokens)`;
  }

  /**
   * Get detailed analysis
   */
  getAnalysis(): Record<string, any> {
    return {
      id: this.id,
      network: this.network,
      tokenPair: this.tokenPair,
      estimatedProfit: this.estimatedProfit,
      actualProfit: this.actualProfit,
      netProfit: this.getNetProfit(),
      profitPercentage: this.profitPercentage,
      actualProfitPercentage: this.getActualProfitPercentage(),
      status: this.status,
      gasEstimate: this.estimatedGasFee,
      actualGas: this.actualGasFee,
      executionTime: this.executedAt && this.completedAt 
        ? this.completedAt.getTime() - this.executedAt.getTime() 
        : null,
      isSuccessful: this.isSuccessful(),
    };
  }
} 