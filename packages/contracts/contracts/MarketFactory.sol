// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Market.sol";

/**
 * @title MarketFactory
 * @dev Factory contract for creating prediction markets
 */
contract MarketFactory is Ownable, ReentrancyGuard {
    /// @dev LMSR liquidity parameter - controls price sensitivity
    uint256 public b = 1_000 * 1e18; // Default: 1,000 PT
    
    /// @dev Address of the PlayToken contract
    address public immutable playToken;
    
    /// @dev Address of the oracle (authorized to resolve markets)
    address public oracle;
    
    /// @dev Address of the Conditional Tokens Framework
    address public immutable conditionalTokens;
    
    /// @dev Array of all created markets
    address[] public markets;
    
    /// @dev Mapping from market address to market info
    mapping(address => bool) public isMarket;
    
    /// @dev Emitted when a new market is created
    event MarketCreated(
        address indexed market,
        string title,
        string kpiDescription,
        uint64 tradingDeadline,
        uint64 resolutionTime,
        uint256 liquidityParameter
    );
    
    /// @dev Emitted when oracle is changed
    event OracleChanged(address indexed oldOracle, address indexed newOracle);
    
    /// @dev Emitted when liquidity parameter is changed
    event LiquidityParameterChanged(uint256 oldB, uint256 newB);

    /**
     * @dev Constructor
     * @param _playToken Address of the PlayToken contract
     * @param _oracle Address of the oracle
     * @param _conditionalTokens Address of the Conditional Tokens Framework
     */
    constructor(
        address _playToken,
        address _oracle,
        address _conditionalTokens
    ) Ownable(msg.sender) {
        require(_playToken != address(0), "MarketFactory: Invalid PlayToken address");
        require(_oracle != address(0), "MarketFactory: Invalid oracle address");
        require(_conditionalTokens != address(0), "MarketFactory: Invalid ConditionalTokens address");
        
        playToken = _playToken;
        oracle = _oracle;
        conditionalTokens = _conditionalTokens;
    }

    /**
     * @dev Create a new prediction market
     * @param _title Title of the market
     * @param _kpiDescription Description of the KPI to be measured
     * @param _tradingDeadline Timestamp when trading ends
     * @param _resolutionTime Timestamp when market can be resolved
     * @param _numOutcomes Number of possible outcomes (proposals)
     * @return address Address of the created market
     */
    function createMarket(
        string calldata _title,
        string calldata _kpiDescription,
        uint64 _tradingDeadline,
        uint64 _resolutionTime,
        uint256 _numOutcomes
    ) external onlyOwner nonReentrant returns (address) {
        require(bytes(_title).length > 0, "MarketFactory: Title cannot be empty");
        require(bytes(_kpiDescription).length > 0, "MarketFactory: KPI description cannot be empty");
        require(_tradingDeadline > block.timestamp, "MarketFactory: Trading deadline must be in the future");
        require(_resolutionTime > _tradingDeadline, "MarketFactory: Resolution time must be after trading deadline");
        require(_numOutcomes >= 2, "MarketFactory: Must have at least 2 outcomes");
        require(_numOutcomes <= 100, "MarketFactory: Too many outcomes");
        
        Market market = new Market(
            playToken,
            oracle,
            conditionalTokens,
            _title,
            _kpiDescription,
            _tradingDeadline,
            _resolutionTime,
            _numOutcomes,
            b
        );
        
        address marketAddress = address(market);
        markets.push(marketAddress);
        isMarket[marketAddress] = true;
        
        emit MarketCreated(
            marketAddress,
            _title,
            _kpiDescription,
            _tradingDeadline,
            _resolutionTime,
            b
        );
        
        return marketAddress;
    }

    /**
     * @dev Set the oracle address
     * @param _oracle New oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "MarketFactory: Invalid oracle address");
        
        address oldOracle = oracle;
        oracle = _oracle;
        
        emit OracleChanged(oldOracle, _oracle);
    }

    /**
     * @dev Set the LMSR liquidity parameter
     * @param _b New liquidity parameter
     */
    function setLiquidityParameter(uint256 _b) external onlyOwner {
        require(_b > 0, "MarketFactory: Liquidity parameter must be greater than 0");
        
        uint256 oldB = b;
        b = _b;
        
        emit LiquidityParameterChanged(oldB, _b);
    }

    /**
     * @dev Get the number of markets created
     * @return uint256 Number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }

    /**
     * @dev Get market address by index
     * @param index Index of the market
     * @return address Market address
     */
    function getMarket(uint256 index) external view returns (address) {
        require(index < markets.length, "MarketFactory: Market index out of bounds");
        return markets[index];
    }

    /**
     * @dev Get all market addresses
     * @return address[] Array of market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return markets;
    }
}