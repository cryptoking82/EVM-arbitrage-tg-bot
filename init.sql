-- Database initialization script for Telegram Arbitrage Bot
-- This script creates the database and initial configuration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial admin user (replace with your actual Telegram ID)
-- Note: This will be created automatically when you first use the bot
-- This is just for reference

-- Insert initial DEX configurations for each network
-- Ethereum DEXes
INSERT INTO dexes (id, name, symbol, type, network, router_address, factory_address, weth_address, status, is_active, fee_percentage, priority) VALUES
('uuid_generate_v4()', 'Uniswap V2', 'UNI', 'uniswap_v2', 'eth', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'active', true, 0.003, 1),
('uuid_generate_v4()', 'SushiSwap', 'SUSHI', 'sushiswap', 'eth', '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'active', true, 0.003, 2);

-- BSC DEXes
INSERT INTO dexes (id, name, symbol, type, network, router_address, factory_address, weth_address, status, is_active, fee_percentage, priority) VALUES
('uuid_generate_v4()', 'PancakeSwap V2', 'CAKE', 'pancakeswap', 'bsc', '0x10ED43C718714eb63d5aA57B78B54704E256024E', '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'active', true, 0.0025, 1),
('uuid_generate_v4()', 'SushiSwap BSC', 'SUSHI', 'sushiswap', 'bsc', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', '0xc35DADB65012eC5796536bD9864eD8773aBc74C4', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'active', true, 0.003, 2);

-- Polygon DEXes
INSERT INTO dexes (id, name, symbol, type, network, router_address, factory_address, weth_address, status, is_active, fee_percentage, priority) VALUES
('uuid_generate_v4()', 'QuickSwap', 'QUICK', 'quickswap', 'polygon', '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32', '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 'active', true, 0.003, 1),
('uuid_generate_v4()', 'SushiSwap Polygon', 'SUSHI', 'sushiswap', 'polygon', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', '0xc35DADB65012eC5796536bD9864eD8773aBc74C4', '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 'active', true, 0.003, 2);

-- Insert common tokens for each network
-- Ethereum tokens
INSERT INTO tokens (id, address, network, symbol, name, decimals, standard, status, is_active, is_stablecoin, is_wrapped_native, priority) VALUES
('uuid_generate_v4()', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'eth', 'WETH', 'Wrapped Ether', 18, 'ERC20', 'active', true, false, true, 1),
('uuid_generate_v4()', '0xA0b86a33E6441039d435C6D0c8C9a7e6e33a3c5A', 'eth', 'USDC', 'USD Coin', 6, 'ERC20', 'active', true, true, false, 2),
('uuid_generate_v4()', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 'eth', 'USDT', 'Tether USD', 6, 'ERC20', 'active', true, true, false, 3),
('uuid_generate_v4()', '0x6B175474E89094C44Da98b954EedeAC495271d0F', 'eth', 'DAI', 'Dai Stablecoin', 18, 'ERC20', 'active', true, true, false, 4);

-- BSC tokens
INSERT INTO tokens (id, address, network, symbol, name, decimals, standard, status, is_active, is_stablecoin, is_wrapped_native, priority) VALUES
('uuid_generate_v4()', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'bsc', 'WBNB', 'Wrapped BNB', 18, 'BEP20', 'active', true, false, true, 1),
('uuid_generate_v4()', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 'bsc', 'USDC', 'USD Coin', 18, 'BEP20', 'active', true, true, false, 2),
('uuid_generate_v4()', '0x55d398326f99059fF775485246999027B3197955', 'bsc', 'USDT', 'Tether USD', 18, 'BEP20', 'active', true, true, false, 3),
('uuid_generate_v4()', '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 'bsc', 'DAI', 'Dai Token', 18, 'BEP20', 'active', true, true, false, 4);

-- Polygon tokens
INSERT INTO tokens (id, address, network, symbol, name, decimals, standard, status, is_active, is_stablecoin, is_wrapped_native, priority) VALUES
('uuid_generate_v4()', '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 'polygon', 'WMATIC', 'Wrapped Matic', 18, 'ERC20', 'active', true, false, true, 1),
('uuid_generate_v4()', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 'polygon', 'USDC', 'USD Coin', 6, 'ERC20', 'active', true, true, false, 2),
('uuid_generate_v4()', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 'polygon', 'USDT', 'Tether USD', 6, 'ERC20', 'active', true, true, false, 3),
('uuid_generate_v4()', '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 'polygon', 'DAI', 'Dai Stablecoin', 18, 'ERC20', 'active', true, true, false, 4);

-- Create database maintenance functions
CREATE OR REPLACE FUNCTION cleanup_old_records() RETURNS void AS $$
BEGIN
    -- Clean up old health checks (keep last 7 days)
    DELETE FROM health_checks WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Clean up old notification logs (keep last 30 days)
    DELETE FROM notification_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up expired user sessions
    UPDATE user_sessions SET status = 'expired' WHERE expires_at < NOW() AND status = 'active';
    
    -- Clean up old expired opportunities (keep last 24 hours)
    DELETE FROM arbitrage_opportunities 
    WHERE status = 'expired' AND created_at < NOW() - INTERVAL '24 hours';
    
    RAISE NOTICE 'Database cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_network_status ON transactions(network, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arbitrage_opportunities_network_status ON arbitrage_opportunities(network, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arbitrage_opportunities_profit ON arbitrage_opportunities(profit_percentage DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tokens_network_active ON tokens(network, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dexes_network_active ON dexes(network, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- Create view for active arbitrage opportunities
CREATE OR REPLACE VIEW active_opportunities AS
SELECT 
    id,
    network,
    token_pair,
    profit_percentage,
    estimated_profit,
    required_amount,
    status,
    detected_at,
    expires_at
FROM arbitrage_opportunities 
WHERE status IN ('detected', 'analyzing') 
    AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY profit_percentage DESC;

-- Create view for trading statistics
CREATE OR REPLACE VIEW trading_stats AS
SELECT 
    network,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_trades,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::decimal / COUNT(*)) * 100, 2
    ) as success_rate,
    SUM(COALESCE(actual_profit::numeric, 0)) as total_profit,
    AVG(COALESCE(actual_profit::numeric, 0)) FILTER (WHERE status = 'completed') as avg_profit,
    MAX(COALESCE(actual_profit::numeric, 0)) as best_profit
FROM arbitrage_opportunities 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY network;

-- Insert system configuration (this would normally be done via the application)
-- These are just examples and placeholders

COMMIT; 