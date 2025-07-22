# Telegram Arbitrage Bot

A comprehensive Telegram bot for EVM blockchain arbitrage trading with multi-chain support for Ethereum, BSC, and Polygon networks.

## 🌟 Features

### Core Functionality
- **Multi-Chain Support**: Ethereum, BSC, and Polygon networks
- **Atomic Arbitrage**: Smart contract-based atomic swaps
- **Real-time Monitoring**: Continuous opportunity detection
- **Telegram Control**: Full bot control via Telegram commands
- **Web Dashboard**: Admin panel for DEX and token management
- **Risk Management**: Configurable slippage and profit thresholds

### Advanced Features
- **Role-based Access Control**: Admin, User, and Viewer roles
- **Rate Limiting & Anti-Spam**: Protection against abuse
- **Health Monitoring**: System health checks and alerts
- **Notification System**: Email, SMS, and Telegram alerts
- **Performance Analytics**: Detailed profit and loss tracking
- **Docker Support**: Easy deployment with Docker Compose

### Security
- **Smart Contract Security**: OpenZeppelin libraries
- **Input Validation**: Comprehensive security checks
- **Emergency Controls**: Pause/resume functionality
- **Secure Key Management**: Environment variable protection

## 📋 Requirements

- Node.js 18.0.0 or higher
- PostgreSQL 12 or higher
- Redis (optional, for enhanced performance)
- Docker & Docker Compose (for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EvmArbitrage-TGbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:


```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id_here

# Database Configuration
DATABASE_URL=postgresql://arbitrage_user:secure_password@localhost:5432/arbitrage_bot

# Blockchain Configuration
ETH_RPC_URL=https://mainnet.infura.io/v3/your_project_id
ETH_PRIVATE_KEY=your_ethereum_private_key
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
BSC_PRIVATE_KEY=your_bsc_private_key
POLYGON_RPC_URL=https://polygon-rpc.com/
POLYGON_PRIVATE_KEY=your_polygon_private_key

# Application Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_here
```

### 4. Database Setup

Start PostgreSQL and create the database:

```bash
# Using Docker
docker run --name postgres -e POSTGRES_PASSWORD=secure_password -e POSTGRES_DB=arbitrage_bot -e POSTGRES_USER=arbitrage_user -p 5432:5432 -d postgres:15-alpine

# Run migrations
npm run db:migrate
```

### 5. Smart Contract Deployment

Compile and deploy smart contracts:

```bash
# Compile contracts
npm run hardhat:compile

# Deploy to testnet (for testing)
npx hardhat run scripts/deploy.ts --network goerli

# Deploy to mainnet (for production)
npx hardhat run scripts/deploy.ts --network mainnet
```

Update your `.env` file with the deployed contract addresses.

### 6. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down
```

### Manual Docker Build

```bash
# Build the image
docker build -t telegram-arbitrage-bot .

# Run the container
docker run -d --name arbitrage-bot --env-file .env -p 3000:3000 telegram-arbitrage-bot
```

## 📱 Telegram Bot Commands

### Public Commands (All Users)

- `/start` - Initialize bot and show welcome message
- `/help` - Display help information
- `/status` - Show current bot status
- `/stats` - View arbitrage statistics
- `/menu` - Display interactive menu

### User Commands (Users and Admins)

- `/opportunities` - List current arbitrage opportunities
- `/trades` - Show recent trades
- `/profit` - Display profit summary
- `/networks` - Show supported networks

### Admin Commands (Admin Only)

- `/admin` - Access admin panel
- `/users` - List all users
- `/health` - System health check
- `/logs` - View recent logs
- `/settings` - Configure bot settings
- `/start_arbitrage` - Start arbitrage engine
- `/stop_arbitrage` - Stop arbitrage engine
- `/pause` - Pause operations
- `/resume` - Resume operations

## 🎛️ Web Dashboard

Access the web dashboard at `http://localhost:3000` for:

- DEX management (add/edit/remove exchanges)
- Token management (add/edit/remove tokens)
- User management and permissions
- System monitoring and health checks
- Performance analytics and reports

### Dashboard Features

1. **DEX Management**
   - Add new DEX configurations
   - Update router and factory addresses
   - Set trading fees and priorities
   - Health check monitoring

2. **Token Management**
   - Add supported tokens
   - Set trading limits and parameters
   - Price data integration
   - Token verification status

3. **Analytics Dashboard**
   - Real-time profit/loss tracking
   - Success rate analytics
   - Network performance comparison
   - Gas usage optimization insights

## ⚙️ Configuration

### Arbitrage Parameters

Configure arbitrage settings in your `.env` file:

```env
# Minimum profit threshold (in ETH/BNB/MATIC)
MIN_PROFIT_THRESHOLD=0.01

# Maximum slippage tolerance (0.5%)
MAX_SLIPPAGE=0.005

# Gas price multiplier for faster execution
GAS_PRICE_MULTIPLIER=1.1

# Maximum gas limit for transactions
MAX_GAS_LIMIT=500000
```

### Network Configuration

Each network can be configured independently:

```javascript
// Example network configuration
const networkConfig = {
  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL,
    chainId: 1,
    gasPrice: 'auto',
    confirmations: 2
  },
  bsc: {
    rpcUrl: process.env.BSC_RPC_URL,
    chainId: 56,
    gasPrice: 5000000000, // 5 gwei
    confirmations: 3
  },
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL,
    chainId: 137,
    gasPrice: 'auto',
    confirmations: 5
  }
};
```

## 📊 Monitoring & Alerts

### Health Checks

The bot continuously monitors:
- Database connectivity
- RPC node responsiveness
- Telegram API availability
- Smart contract accessibility
- Memory and CPU usage

### Notification System

Configure multiple notification channels:

```env
# Email notifications
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS notifications (optional)
SMS_ENABLED=false
SMS_API_KEY=your_sms_api_key
SMS_PHONE_NUMBER=+1234567890
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run smart contract tests
npm run hardhat:test

# Generate coverage report
npm test -- --coverage
```

### Test Structure

```
test/
├── unit/                 # Unit tests
│   ├── services/
│   ├── entities/
│   └── utils/
├── integration/          # Integration tests
│   ├── api/
│   ├── database/
│   └── blockchain/
└── e2e/                 # End-to-end tests
    ├── telegram/
    └── arbitrage/
```

## 🔒 Security Best Practices

### Private Key Management

- Never commit private keys to version control
- Use environment variables for sensitive data
- Consider using hardware wallets for production
- Implement key rotation policies

### Smart Contract Security

- Contracts use OpenZeppelin libraries
- Implement reentrancy protection
- Emergency pause functionality
- Multi-signature wallet integration (recommended)

### Network Security

- Use HTTPS for all API communications
- Implement rate limiting
- Regular security audits
- Monitor for suspicious activities

## 📈 Performance Optimization

### Database Optimization

- Regular database maintenance
- Index optimization
- Connection pooling
- Query optimization

### Network Optimization

- RPC node redundancy
- Request caching
- Batch operations
- Load balancing

### Gas Optimization

- Dynamic gas price calculation
- Gas limit optimization
- MEV protection strategies
- Transaction timing optimization

## 🛠️ Development

### Code Structure

```
src/
├── config/              # Configuration files
├── entities/            # Database entities
├── services/            # Business logic services
│   ├── telegram/        # Telegram bot service
│   ├── arbitrage/       # Arbitrage engine
│   ├── blockchain/      # Blockchain interaction
│   ├── notification/    # Notification service
│   └── web/            # Web server
├── utils/               # Utility functions
└── types/               # TypeScript type definitions
```

### Adding New Features

1. Create feature branch
2. Implement functionality
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

### Code Quality

- ESLint configuration for code consistency
- Prettier for code formatting
- TypeScript for type safety
- Jest for testing

## 📚 API Documentation

### REST API Endpoints

The web server exposes REST API endpoints:

```
GET    /api/health           # Health check
GET    /api/stats            # Statistics
GET    /api/opportunities    # Current opportunities
GET    /api/trades          # Trade history
POST   /api/admin/settings  # Update settings (admin only)
```

### Webhook Support

Configure webhooks for external integrations:

```env
WEBHOOK_URL=https://your-webhook-endpoint.com
WEBHOOK_SECRET=your_webhook_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Join our community discussions

## 🔗 Links

- [Documentation](docs/)
- [API Reference](docs/api.md)
- [Smart Contract Documentation](docs/contracts.md)
- [Deployment Guide](docs/deployment.md)

## ⚠️ Disclaimer

This software is for educational and research purposes. Cryptocurrency trading involves risk of loss. Use at your own risk and ensure compliance with local regulations.

---

**Built with ❤️ for the DeFi community** 