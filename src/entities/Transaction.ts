import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ArbitrageOpportunity } from './ArbitrageOpportunity';

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  ARBITRAGE = 'arbitrage',
  SWAP = 'swap',
  TRANSFER = 'transfer',
}

/**
 * Transaction entity for tracking blockchain transactions
 */
@Entity('transactions')
@Index(['hash'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['blockNumber'])
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 66, unique: true })
  hash: string;

  @Column({ length: 10 })
  network: string; // eth, bsc, polygon

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.ARBITRAGE,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ length: 42 })
  fromAddress: string;

  @Column({ length: 42, nullable: true })
  toAddress: string;

  @Column({ type: 'bigint', nullable: true })
  blockNumber: number;

  @Column({ type: 'integer', nullable: true })
  transactionIndex: number;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  gasUsed: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  gasPrice: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  gasFee: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  inputAmount: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  outputAmount: string;

  @Column({ length: 42, nullable: true })
  inputToken: string;

  @Column({ length: 42, nullable: true })
  outputToken: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  profitAmount: string;

  @Column({ length: 10, nullable: true })
  profitToken: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  profitPercentage: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ArbitrageOpportunity, opportunity => opportunity.transactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'opportunityId' })
  opportunity: ArbitrageOpportunity;

  @Column({ type: 'uuid', nullable: true })
  opportunityId: string;

  /**
   * Check if transaction is successful
   */
  isSuccessful(): boolean {
    return this.status === TransactionStatus.CONFIRMED;
  }

  /**
   * Check if transaction failed
   */
  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  /**
   * Check if transaction is pending
   */
  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  /**
   * Get profit in USD (if metadata contains USD rates)
   */
  getProfitUSD(): number | null {
    if (!this.profitAmount || !this.metadata?.usdRate) {
      return null;
    }
    return parseFloat(this.profitAmount) * this.metadata.usdRate;
  }

  /**
   * Get transaction URL for block explorer
   */
  getExplorerUrl(): string {
    const baseUrls = {
      eth: 'https://etherscan.io/tx/',
      bsc: 'https://bscscan.com/tx/',
      polygon: 'https://polygonscan.com/tx/',
    };
    
    return baseUrls[this.network] ? `${baseUrls[this.network]}${this.hash}` : '';
  }

  /**
   * Calculate effective gas price
   */
  getEffectiveGasPrice(): string {
    if (!this.gasUsed || !this.gasFee) return '0';
    
    const gasUsed = parseFloat(this.gasUsed);
    const gasFee = parseFloat(this.gasFee);
    
    if (gasUsed === 0) return '0';
    
    return (gasFee / gasUsed).toString();
  }

  /**
   * Mark transaction as confirmed
   */
  markAsConfirmed(blockNumber: number, transactionIndex: number): void {
    this.status = TransactionStatus.CONFIRMED;
    this.blockNumber = blockNumber;
    this.transactionIndex = transactionIndex;
    this.confirmedAt = new Date();
  }

  /**
   * Mark transaction as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = TransactionStatus.FAILED;
    this.errorMessage = errorMessage;
  }
} 