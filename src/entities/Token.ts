import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TokenStandard {
  ERC20 = 'ERC20',
  BEP20 = 'BEP20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

export enum TokenStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  SUSPICIOUS = 'suspicious',
}

/**
 * Token entity for managing cryptocurrency token information
 */
@Entity('tokens')
@Index(['address', 'network'], { unique: true })
@Index(['symbol'])
@Index(['isActive'])
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 42 })
  address: string;

  @Column({ length: 10 })
  network: string; // eth, bsc, polygon

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'integer' })
  decimals: number;

  @Column({
    type: 'enum',
    enum: TokenStandard,
    default: TokenStandard.ERC20,
  })
  standard: TokenStandard;

  @Column({
    type: 'enum',
    enum: TokenStatus,
    default: TokenStatus.ACTIVE,
  })
  status: TokenStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  totalSupply: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  circulatingSupply: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  priceUSD: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  marketCapUSD: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  volume24hUSD: number;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isStablecoin: boolean;

  @Column({ type: 'boolean', default: false })
  isWrappedNative: boolean;

  @Column({ type: 'integer', default: 1 })
  priority: number; // Priority for arbitrage (1 = highest)

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  minTradeAmount: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  maxTradeAmount: string;

  @Column({ type: 'timestamp', nullable: true })
  lastPriceUpdate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVerified: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if token is available for trading
   */
  isAvailable(): boolean {
    return this.isActive && this.status === TokenStatus.ACTIVE;
  }

  /**
   * Format amount according to token decimals
   */
  formatAmount(amount: string | number): string {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    return amountNum.toFixed(Math.min(this.decimals, 6));
  }

  /**
   * Convert human readable amount to wei (smallest unit)
   */
  toWei(amount: string | number): string {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    const multiplier = Math.pow(10, this.decimals);
    return Math.floor(amountNum * multiplier).toString();
  }

  /**
   * Convert wei to human readable amount
   */
  fromWei(amount: string): string {
    const amountNum = parseFloat(amount);
    const divisor = Math.pow(10, this.decimals);
    return (amountNum / divisor).toString();
  }

  /**
   * Get display name with symbol
   */
  getDisplayName(): string {
    return `${this.name} (${this.symbol})`;
  }

  /**
   * Get block explorer URL for token
   */
  getExplorerUrl(): string {
    const baseUrls = {
      eth: 'https://etherscan.io/token/',
      bsc: 'https://bscscan.com/token/',
      polygon: 'https://polygonscan.com/token/',
    };
    
    return baseUrls[this.network] ? `${baseUrls[this.network]}${this.address}` : '';
  }

  /**
   * Check if price data is fresh (updated within last hour)
   */
  isPriceDataFresh(): boolean {
    if (!this.lastPriceUpdate) return false;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.lastPriceUpdate > oneHourAgo;
  }

  /**
   * Update price information
   */
  updatePrice(priceUSD: number, marketCapUSD?: number, volume24hUSD?: number): void {
    this.priceUSD = priceUSD;
    if (marketCapUSD !== undefined) this.marketCapUSD = marketCapUSD;
    if (volume24hUSD !== undefined) this.volume24hUSD = volume24hUSD;
    this.lastPriceUpdate = new Date();
  }

  /**
   * Check if amount is within trading limits
   */
  isAmountValid(amount: string): boolean {
    const amountNum = parseFloat(amount);
    
    if (this.minTradeAmount && amountNum < parseFloat(this.minTradeAmount)) {
      return false;
    }
    
    if (this.maxTradeAmount && amountNum > parseFloat(this.maxTradeAmount)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get native token address for the network
   */
  static getNativeTokenAddress(network: string): string {
    const nativeTokens = {
      eth: '0x0000000000000000000000000000000000000000',
      bsc: '0x0000000000000000000000000000000000000000',
      polygon: '0x0000000000000000000000000000000000000000',
    };
    
    return nativeTokens[network] || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Get wrapped native token address for the network
   */
  static getWrappedNativeAddress(network: string): string {
    const wrappedTokens = {
      eth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
    };
    
    return wrappedTokens[network] || '';
  }

  /**
   * Validate token configuration
   */
  validateConfig(): string[] {
    const errors: string[] = [];

    if (!this.address || this.address.length !== 42) {
      errors.push('Invalid token address');
    }

    if (!this.symbol || this.symbol.length === 0) {
      errors.push('Token symbol is required');
    }

    if (!this.name || this.name.length === 0) {
      errors.push('Token name is required');
    }

    if (this.decimals < 0 || this.decimals > 18) {
      errors.push('Token decimals must be between 0 and 18');
    }

    return errors;
  }
} 