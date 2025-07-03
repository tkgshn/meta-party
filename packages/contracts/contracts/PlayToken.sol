// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlayToken
 * @dev Play Token (PT) for Futarchy platform - no real monetary value
 * Users can claim 1,000 PT once per address for participating in prediction markets
 */
contract PlayToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant AIRDROP_AMOUNT = 1_000 * 1e18; // 1,000 PT with 18 decimals
    
    /// @dev Tracks whether an address has already claimed their airdrop
    mapping(address => bool) public claimed;
    
    /// @dev Emitted when a user claims their airdrop
    event AirdropClaimed(address indexed user, uint256 amount);
    
    /// @dev Emitted when admin mints tokens
    event AdminMint(address indexed to, uint256 amount);

    constructor() ERC20("Play Token", "PT") Ownable(msg.sender) {}

    /**
     * @dev Allows users to claim their one-time airdrop of 1,000 PT
     * @notice Each address can only claim once
     */
    function claim() external nonReentrant {
        require(!claimed[msg.sender], "PlayToken: Already claimed");
        require(msg.sender != address(0), "PlayToken: Invalid address");
        
        claimed[msg.sender] = true;
        _mint(msg.sender, AIRDROP_AMOUNT);
        
        emit AirdropClaimed(msg.sender, AIRDROP_AMOUNT);
    }

    /**
     * @dev Emergency function for admin to mint tokens
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function adminMint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "PlayToken: Invalid address");
        require(amount > 0, "PlayToken: Amount must be greater than 0");
        
        _mint(to, amount);
        emit AdminMint(to, amount);
    }

    /**
     * @dev Check if an address has claimed their airdrop
     * @param user Address to check
     * @return bool Whether the address has claimed
     */
    function hasClaimed(address user) external view returns (bool) {
        return claimed[user];
    }

    /**
     * @dev Get the total number of tokens that can be claimed
     * @return uint256 The airdrop amount
     */
    function getAirdropAmount() external pure returns (uint256) {
        return AIRDROP_AMOUNT;
    }
}