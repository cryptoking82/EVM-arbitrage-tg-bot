// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ArbitrageBot
 * @dev Smart contract for executing atomic arbitrage trades across DEXes
 */
contract ArbitrageBot is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event ArbitrageExecuted(
        address indexed tokenA,
        address indexed tokenB,
        address indexed dexA,
        address dexB,
        uint256 amountIn,
        uint256 profit,
        uint256 gasUsed
    );

    event ProfitWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    event EmergencyWithdrawal(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    event ConfigUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue
    );

    // Configuration parameters
    uint256 public maxSlippage = 500; // 5% in basis points
    uint256 public maxGasPrice = 100 gwei;
    uint256 public minProfitThreshold = 0.01 ether; // Minimum profit in wei
    uint256 public feePercentage = 100; // 1% fee in basis points
    
    // Fee recipient
    address public feeRecipient;
    
    // Authorized bots (addresses that can execute arbitrage)
    mapping(address => bool) public authorizedBots;
    
    // Emergency stop for specific tokens
    mapping(address => bool) public tokenBlacklist;
    
    // DEX router interfaces
    interface IDEXRouter {
        function swapExactTokensForTokens(
            uint256 amountIn,
            uint256 amountOutMin,
            address[] calldata path,
            address to,
            uint256 deadline
        ) external returns (uint256[] memory amounts);
        
        function getAmountsOut(
            uint256 amountIn,
            address[] calldata path
        ) external view returns (uint256[] memory amounts);
    }

    modifier onlyAuthorizedBot() {
        require(authorizedBots[msg.sender], "ArbitrageBot: Not authorized");
        _;
    }

    modifier validToken(address token) {
        require(token != address(0), "ArbitrageBot: Invalid token address");
        require(!tokenBlacklist[token], "ArbitrageBot: Token blacklisted");
        _;
    }

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "ArbitrageBot: Invalid fee recipient");
        feeRecipient = _feeRecipient;
        authorizedBots[msg.sender] = true;
    }

    /**
     * @dev Execute arbitrage between two DEXes
     * @param tokenA Token to arbitrage
     * @param tokenB Paired token
     * @param dexA First DEX router address
     * @param dexB Second DEX router address
     * @param amountIn Amount of tokenA to use
     * @param minProfitExpected Minimum profit expected
     */
    function executeArbitrage(
        address tokenA,
        address tokenB,
        address dexA,
        address dexB,
        uint256 amountIn,
        uint256 minProfitExpected
    )
        external
        nonReentrant
        whenNotPaused
        onlyAuthorizedBot
        validToken(tokenA)
        validToken(tokenB)
    {
        require(tx.gasprice <= maxGasPrice, "ArbitrageBot: Gas price too high");
        require(minProfitExpected >= minProfitThreshold, "ArbitrageBot: Profit too low");
        
        uint256 gasStart = gasleft();
        uint256 initialBalance = IERC20(tokenA).balanceOf(address(this));
        
        require(initialBalance >= amountIn, "ArbitrageBot: Insufficient balance");

        // Step 1: Trade tokenA for tokenB on DEX A
        uint256 tokenBReceived = _swapOnDEX(
            dexA,
            tokenA,
            tokenB,
            amountIn,
            0 // Will calculate minimum below
        );

        require(tokenBReceived > 0, "ArbitrageBot: First swap failed");

        // Step 2: Trade tokenB back to tokenA on DEX B
        uint256 tokenAReceived = _swapOnDEX(
            dexB,
            tokenB,
            tokenA,
            tokenBReceived,
            amountIn // Must get at least the original amount back
        );

        require(tokenAReceived > amountIn, "ArbitrageBot: No arbitrage profit");

        uint256 profit = tokenAReceived - amountIn;
        require(profit >= minProfitExpected, "ArbitrageBot: Profit below expectation");

        // Calculate and transfer fee
        uint256 fee = (profit * feePercentage) / 10000;
        if (fee > 0) {
            IERC20(tokenA).safeTransfer(feeRecipient, fee);
        }

        uint256 gasUsed = gasStart - gasleft();

        emit ArbitrageExecuted(
            tokenA,
            tokenB,
            dexA,
            dexB,
            amountIn,
            profit - fee,
            gasUsed
        );
    }

    /**
     * @dev Execute swap on a specific DEX
     */
    function _swapOnDEX(
        address dexRouter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal returns (uint256) {
        IERC20(tokenIn).safeApprove(dexRouter, amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IDEXRouter(dexRouter).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300 // 5 minutes deadline
        );

        return amounts[amounts.length - 1];
    }

    /**
     * @dev Get expected output for a swap
     */
    function getAmountsOut(
        address dexRouter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IDEXRouter(dexRouter).getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }

    /**
     * @dev Simulate arbitrage to check profitability
     */
    function simulateArbitrage(
        address tokenA,
        address tokenB,
        address dexA,
        address dexB,
        uint256 amountIn
    ) external view returns (uint256 profit, bool profitable) {
        // Get output from first swap (A -> B on DEX A)
        uint256 tokenBOut = this.getAmountsOut(dexA, tokenA, tokenB, amountIn);
        
        if (tokenBOut == 0) return (0, false);

        // Get output from second swap (B -> A on DEX B)
        uint256 tokenAOut = this.getAmountsOut(dexB, tokenB, tokenA, tokenBOut);
        
        if (tokenAOut <= amountIn) return (0, false);

        profit = tokenAOut - amountIn;
        profitable = profit >= minProfitThreshold;
    }

    /**
     * @dev Add or remove authorized bot
     */
    function setAuthorizedBot(address bot, bool authorized) external onlyOwner {
        authorizedBots[bot] = authorized;
    }

    /**
     * @dev Update configuration parameters
     */
    function updateConfig(
        uint256 _maxSlippage,
        uint256 _maxGasPrice,
        uint256 _minProfitThreshold,
        uint256 _feePercentage
    ) external onlyOwner {
        require(_maxSlippage <= 1000, "ArbitrageBot: Slippage too high"); // Max 10%
        require(_feePercentage <= 1000, "ArbitrageBot: Fee too high"); // Max 10%

        emit ConfigUpdated("maxSlippage", maxSlippage, _maxSlippage);
        emit ConfigUpdated("maxGasPrice", maxGasPrice, _maxGasPrice);
        emit ConfigUpdated("minProfitThreshold", minProfitThreshold, _minProfitThreshold);
        emit ConfigUpdated("feePercentage", feePercentage, _feePercentage);

        maxSlippage = _maxSlippage;
        maxGasPrice = _maxGasPrice;
        minProfitThreshold = _minProfitThreshold;
        feePercentage = _feePercentage;
    }

    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "ArbitrageBot: Invalid address");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Blacklist/whitelist token
     */
    function setTokenBlacklist(address token, bool blacklisted) external onlyOwner {
        tokenBlacklist[token] = blacklisted;
    }

    /**
     * @dev Withdraw profits (owner only)
     */
    function withdrawProfits(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "ArbitrageBot: Invalid amount");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "ArbitrageBot: Insufficient balance");

        IERC20(token).safeTransfer(owner(), amount);
        
        emit ProfitWithdrawn(token, owner(), amount);
    }

    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "ArbitrageBot: No balance");

        IERC20(token).safeTransfer(owner(), balance);
        
        emit EmergencyWithdrawal(token, owner(), balance);
    }

    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract balance for a token
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Check if address is authorized bot
     */
    function isAuthorizedBot(address bot) external view returns (bool) {
        return authorizedBots[bot];
    }

    /**
     * @dev Get current configuration
     */
    function getConfig() external view returns (
        uint256 _maxSlippage,
        uint256 _maxGasPrice,
        uint256 _minProfitThreshold,
        uint256 _feePercentage,
        address _feeRecipient
    ) {
        return (
            maxSlippage,
            maxGasPrice,
            minProfitThreshold,
            feePercentage,
            feeRecipient
        );
    }
} 