// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlayToken
 * @dev Enhanced Play Token (PT) for Futarchy platform with Twitter OAuth airdrop
 * Backend distributes tokens based on verified Twitter authentication
 * Supports volunteer bonuses and role-based market creation permissions
 */
contract PlayToken is ERC20, Ownable, AccessControl, ReentrancyGuard {
    /// @dev Role for addresses authorized to distribute tokens
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    
    /// @dev Role for addresses authorized to create prediction markets
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");
    
    /// @dev Standard airdrop amount for basic users
    uint256 public constant BASE_AIRDROP_AMOUNT = 1_000 * 1e18; // 1,000 PT
    
    /// @dev Additional bonus for volunteers
    uint256 public constant VOLUNTEER_BONUS_AMOUNT = 2_000 * 1e18; // 2,000 PT
    
    /// @dev Tracks base airdrop claims per address
    mapping(address => bool) public baseAirdropClaimed;
    
    /// @dev Tracks volunteer bonus claims per address
    mapping(address => bool) public volunteerBonusClaimed;
    
    /// @dev Events
    event BaseAirdropClaimed(address indexed user, uint256 amount);
    event VolunteerBonusClaimed(address indexed user, uint256 amount);
    event TokensDistributed(address indexed to, uint256 amount, string reason);
    event DistributorAdded(address indexed distributor);
    event DistributorRemoved(address indexed distributor);
    event MarketCreatorAdded(address indexed creator);
    event MarketCreatorRemoved(address indexed creator);

    constructor() ERC20("Play Token", "PT") Ownable(msg.sender) {
        // Grant admin roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(MARKET_CREATOR_ROLE, msg.sender);
    }

    /**
     * @dev Distributes base airdrop to verified user (called by backend)
     * @param to Address to distribute tokens to
     */
    function distributeBaseAirdrop(address to) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(to != address(0), "PlayToken: Invalid address");
        require(!baseAirdropClaimed[to], "PlayToken: Base airdrop already claimed");
        
        baseAirdropClaimed[to] = true;
        _mint(to, BASE_AIRDROP_AMOUNT);
        
        emit BaseAirdropClaimed(to, BASE_AIRDROP_AMOUNT);
        emit TokensDistributed(to, BASE_AIRDROP_AMOUNT, "Base airdrop");
    }

    /**
     * @dev Distributes volunteer bonus to verified volunteer (called by backend)
     * @param to Address to distribute bonus to
     */
    function distributeVolunteerBonus(address to) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(to != address(0), "PlayToken: Invalid address");
        require(!volunteerBonusClaimed[to], "PlayToken: Volunteer bonus already claimed");
        
        volunteerBonusClaimed[to] = true;
        _mint(to, VOLUNTEER_BONUS_AMOUNT);
        
        emit VolunteerBonusClaimed(to, VOLUNTEER_BONUS_AMOUNT);
        emit TokensDistributed(to, VOLUNTEER_BONUS_AMOUNT, "Volunteer bonus");
    }

    /**
     * @dev Distributes custom amount of tokens (admin only)
     * @param to Address to distribute tokens to
     * @param amount Amount of tokens to distribute
     * @param reason Reason for distribution
     */
    function distributeTokens(address to, uint256 amount, string calldata reason) 
        external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        require(to != address(0), "PlayToken: Invalid address");
        require(amount > 0, "PlayToken: Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensDistributed(to, amount, reason);
    }

    /**
     * @dev Add a new token distributor (backend service address)
     * @param distributor Address to grant distributor role
     */
    function addDistributor(address distributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(distributor != address(0), "PlayToken: Invalid address");
        _grantRole(DISTRIBUTOR_ROLE, distributor);
        emit DistributorAdded(distributor);
    }

    /**
     * @dev Remove a token distributor
     * @param distributor Address to revoke distributor role
     */
    function removeDistributor(address distributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(DISTRIBUTOR_ROLE, distributor);
        emit DistributorRemoved(distributor);
    }

    /**
     * @dev Add a new market creator
     * @param creator Address to grant market creator role
     */
    function addMarketCreator(address creator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(creator != address(0), "PlayToken: Invalid address");
        _grantRole(MARKET_CREATOR_ROLE, creator);
        emit MarketCreatorAdded(creator);
    }

    /**
     * @dev Remove a market creator
     * @param creator Address to revoke market creator role
     */
    function removeMarketCreator(address creator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MARKET_CREATOR_ROLE, creator);
        emit MarketCreatorRemoved(creator);
    }

    /**
     * @dev Check if an address has claimed their base airdrop
     * @param user Address to check
     * @return bool Whether the address has claimed base airdrop
     */
    function hasClaimedBaseAirdrop(address user) external view returns (bool) {
        return baseAirdropClaimed[user];
    }

    /**
     * @dev Check if an address has claimed their volunteer bonus
     * @param user Address to check
     * @return bool Whether the address has claimed volunteer bonus
     */
    function hasClaimedVolunteerBonus(address user) external view returns (bool) {
        return volunteerBonusClaimed[user];
    }

    /**
     * @dev Check if an address can create markets
     * @param user Address to check
     * @return bool Whether the address has market creator role
     */
    function canCreateMarkets(address user) external view returns (bool) {
        return hasRole(MARKET_CREATOR_ROLE, user);
    }

    /**
     * @dev Get the base airdrop amount
     * @return uint256 The base airdrop amount
     */
    function getBaseAirdropAmount() external pure returns (uint256) {
        return BASE_AIRDROP_AMOUNT;
    }

    /**
     * @dev Get the volunteer bonus amount
     * @return uint256 The volunteer bonus amount
     */
    function getVolunteerBonusAmount() external pure returns (uint256) {
        return VOLUNTEER_BONUS_AMOUNT;
    }

    /**
     * @dev Legacy claim function - disabled to enforce Twitter OAuth flow
     * Users must use the distributeBaseAirdrop function via authenticated backend
     */
    function claim() external pure {
        revert("PlayToken: Use Twitter OAuth flow instead");
    }

    /**
     * @dev Legacy hasClaimed function for backward compatibility
     * @param user Address to check
     * @return bool Whether the address has claimed base airdrop
     */
    function hasClaimed(address user) external view returns (bool) {
        return baseAirdropClaimed[user];
    }

    /**
     * @dev Override required by AccessControl
     */
    function supportsInterface(bytes4 interfaceId) 
        public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}