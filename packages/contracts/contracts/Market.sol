// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ConditionalTokens.sol";

/**
 * @title Market
 * @dev Prediction market using LMSR (Logarithmic Market Scoring Rule)
 */
contract Market is ReentrancyGuard {
    
    /// @dev Market phases
    enum Phase { TRADING, CLOSED, RESOLVED }
    
    /// @dev PlayToken contract
    IERC20 public immutable playToken;
    
    /// @dev Conditional Tokens Framework
    ConditionalTokens public immutable ctf;
    
    /// @dev Oracle address (authorized to resolve market)
    address public immutable oracle;
    
    /// @dev LMSR liquidity parameter
    uint256 public immutable b;
    
    /// @dev Market metadata
    string public title;
    string public kpiDescription;
    uint64 public tradingDeadline;
    uint64 public resolutionTime;
    uint256 public numOutcomes;
    
    /// @dev Current market phase
    Phase public phase;
    
    /// @dev Winning outcome index (set during resolution)
    uint256 public winningOutcome;
    
    /// @dev Question ID for conditional tokens
    bytes32 public questionId;
    
    /// @dev Condition ID for conditional tokens
    bytes32 public conditionId;
    
    /// @dev Collection IDs for each outcome
    bytes32[] public collectionIds;
    
    /// @dev Position IDs for each outcome
    uint256[] public positionIds;
    
    /// @dev LMSR state: cumulative quantities for each outcome
    mapping(uint256 => int256) public q;
    
    /// @dev Total funding provided to the market
    uint256 public totalFunding;
    
    /// @dev User balances of collateral (used for LMSR calculations)
    mapping(address => uint256) public collateralBalances;
    
    /// @dev Events
    event Trade(
        address indexed trader,
        uint256 indexed outcome,
        uint256 amount,
        uint256 cost,
        uint256 newPrice
    );
    
    event MarketClosed(uint256 timestamp);
    event MarketResolved(uint256 indexed winningOutcome, uint256 timestamp);
    event FundingAdded(address indexed funder, uint256 amount);

    /**
     * @dev Constructor
     */
    constructor(
        address _playToken,
        address _oracle,
        address _conditionalTokens,
        string memory _title,
        string memory _kpiDescription,
        uint64 _tradingDeadline,
        uint64 _resolutionTime,
        uint256 _numOutcomes,
        uint256 _b
    ) {
        require(_playToken != address(0), "Market: Invalid PlayToken address");
        require(_oracle != address(0), "Market: Invalid oracle address");
        require(_conditionalTokens != address(0), "Market: Invalid ConditionalTokens address");
        
        playToken = IERC20(_playToken);
        oracle = _oracle;
        ctf = ConditionalTokens(_conditionalTokens);
        title = _title;
        kpiDescription = _kpiDescription;
        tradingDeadline = _tradingDeadline;
        resolutionTime = _resolutionTime;
        numOutcomes = _numOutcomes;
        b = _b;
        phase = Phase.TRADING;
        
        // Generate question ID and prepare condition
        questionId = keccak256(abi.encode(address(this), _title, _kpiDescription, block.timestamp));
        
        // Initialize collection IDs and position IDs
        collectionIds = new bytes32[](_numOutcomes);
        positionIds = new uint256[](_numOutcomes);
        
        // Prepare condition in ConditionalTokens
        ctf.prepareCondition(address(this), questionId, _numOutcomes);
        conditionId = ctf.getConditionId(address(this), questionId, _numOutcomes);
        
        // Generate collection IDs for each outcome
        for (uint256 i = 0; i < _numOutcomes; i++) {
            uint256 indexSet = 1 << i; // 2^i
            collectionIds[i] = ctf.getCollectionId(bytes32(0), conditionId, indexSet);
            positionIds[i] = ctf.getPositionId(address(playToken), collectionIds[i]);
        }
    }

    /**
     * @dev Buy shares of a specific outcome
     * @param outcome Index of the outcome to buy
     * @param amount Amount of shares to buy
     */
    function buy(uint256 outcome, uint256 amount) external nonReentrant {
        require(phase == Phase.TRADING, "Market: Trading is not active");
        require(block.timestamp < tradingDeadline, "Market: Trading deadline passed");
        require(outcome < numOutcomes, "Market: Invalid outcome");
        require(amount > 0, "Market: Amount must be greater than 0");
        
        // Calculate cost using LMSR
        uint256 cost = calculateCost(outcome, amount);
        
        // Transfer PlayTokens from user
        require(playToken.transferFrom(msg.sender, address(this), cost), "Market: Transfer failed");
        
        // Update LMSR state
        q[outcome] = q[outcome] + int256(amount);
        
        // Split collateral into conditional tokens
        uint256 collateralAmount = amount;
        collateralBalances[msg.sender] = collateralBalances[msg.sender] + collateralAmount;
        
        // Approve and split tokens
        playToken.approve(address(ctf), collateralAmount);
        ctf.splitPosition(
            address(playToken),
            bytes32(0),
            conditionId,
            _getPartition(),
            collateralAmount
        );
        
        // Transfer the specific outcome tokens to the user
        ctf.safeTransferFrom(
            address(this),
            msg.sender,
            positionIds[outcome],
            amount,
            ""
        );
        
        // Calculate new price
        uint256 newPrice = getPrice(outcome);
        
        emit Trade(msg.sender, outcome, amount, cost, newPrice);
    }

    /**
     * @dev Calculate cost for buying shares using LMSR
     * @param outcome Outcome index
     * @param amount Amount of shares to buy
     * @return uint256 Cost in PlayTokens
     */
    function calculateCost(uint256 outcome, uint256 amount) public view returns (uint256) {
        // Simplified LMSR cost calculation
        // Cost = b * (log(sum(exp(q_i/b))) - log(sum(exp((q_i + delta_i)/b))))
        // Where delta_i = amount if i == outcome, else 0
        
        // For simplicity, use linear approximation for small amounts
        // In production, would use more sophisticated math library
        uint256 currentPrice = getPrice(outcome);
        uint256 cost = (currentPrice * amount) / 1e18;
        
        // Add slippage based on liquidity parameter
        uint256 slippage = (amount * amount) / (b * 2);
        cost = cost + slippage;
        
        return cost;
    }

    /**
     * @dev Get current price for an outcome
     * @param outcome Outcome index
     * @return uint256 Price in 18 decimal format
     */
    function getPrice(uint256 outcome) public view returns (uint256) {
        require(outcome < numOutcomes, "Market: Invalid outcome");
        
        // Simplified price calculation
        // Price = exp(q_i/b) / sum(exp(q_j/b))
        
        // For simplicity, use linear approximation
        int256 totalQ = 0;
        for (uint256 i = 0; i < numOutcomes; i++) {
            totalQ += q[i];
        }
        
        if (totalQ == 0) {
            return 1e18 / numOutcomes; // Equal probability initially
        }
        
        // Simplified: price proportional to quantity
        int256 outcomeQ = q[outcome];
        if (outcomeQ <= 0) {
            return 1e15; // Minimum price (0.1%)
        }
        
        uint256 price = (uint256(outcomeQ) * 1e18) / uint256(totalQ);
        return price > 1e18 ? 1e18 : price; // Cap at 100%
    }

    /**
     * @dev Get all current prices
     * @return uint256[] Array of prices for all outcomes
     */
    function getAllPrices() external view returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](numOutcomes);
        for (uint256 i = 0; i < numOutcomes; i++) {
            prices[i] = getPrice(i);
        }
        return prices;
    }

    /**
     * @dev Close trading (can be called by anyone after deadline)
     */
    function closeTrading() external {
        require(phase == Phase.TRADING, "Market: Trading already closed");
        require(block.timestamp >= tradingDeadline, "Market: Trading deadline not reached");
        
        phase = Phase.CLOSED;
        emit MarketClosed(block.timestamp);
    }

    /**
     * @dev Resolve market with winning outcome
     * @param _winningOutcome Index of the winning outcome
     */
    function resolve(uint256 _winningOutcome) external {
        require(msg.sender == oracle, "Market: Only oracle can resolve");
        require(phase == Phase.CLOSED, "Market: Market not closed");
        require(block.timestamp >= resolutionTime, "Market: Resolution time not reached");
        require(_winningOutcome < numOutcomes, "Market: Invalid winning outcome");
        
        phase = Phase.RESOLVED;
        winningOutcome = _winningOutcome;
        
        // Report payouts to ConditionalTokens
        uint256[] memory payouts = new uint256[](numOutcomes);
        for (uint256 i = 0; i < numOutcomes; i++) {
            payouts[i] = i == _winningOutcome ? 1 : 0;
        }
        
        ctf.reportPayouts(questionId, payouts);
        
        emit MarketResolved(_winningOutcome, block.timestamp);
    }

    /**
     * @dev Redeem winning tokens
     */
    function redeem() external nonReentrant {
        require(phase == Phase.RESOLVED, "Market: Market not resolved");
        
        uint256 winningBalance = ctf.balanceOf(msg.sender, positionIds[winningOutcome]);
        require(winningBalance > 0, "Market: No winning tokens to redeem");
        
        // Redeem conditional tokens for collateral
        uint256[] memory indexSets = new uint256[](1);
        indexSets[0] = 1 << winningOutcome;
        
        ctf.redeemPositions(
            address(playToken),
            bytes32(0),
            conditionId,
            indexSets
        );
        
        // Transfer collateral to user
        uint256 collateralAmount = winningBalance;
        require(playToken.transfer(msg.sender, collateralAmount), "Market: Transfer failed");
    }

    /**
     * @dev Get partition for splitting tokens
     * @return uint256[] Partition array
     */
    function _getPartition() private view returns (uint256[] memory) {
        uint256[] memory partition = new uint256[](numOutcomes);
        for (uint256 i = 0; i < numOutcomes; i++) {
            partition[i] = 1 << i;
        }
        return partition;
    }

    /**
     * @dev Get market info
     * @return Market information struct
     */
    function getMarketInfo() external view returns (
        string memory,
        string memory,
        uint64,
        uint64,
        uint256,
        Phase,
        uint256
    ) {
        return (
            title,
            kpiDescription,
            tradingDeadline,
            resolutionTime,
            numOutcomes,
            phase,
            winningOutcome
        );
    }
}