// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title ConditionalTokens
 * @dev Mock implementation of Gnosis Conditional Tokens for testing
 * This is a simplified version for PoC purposes
 */
contract ConditionalTokens is ERC1155 {
    
    constructor() ERC1155("") {}
    
    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external {
        // Mock implementation - just emit an event or do nothing
    }
    
    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(oracle, questionId, outcomeSlotCount));
    }
    
    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(parentCollectionId, conditionId, indexSet));
    }
    
    function getPositionId(
        address collateralToken,
        bytes32 collectionId
    ) external pure returns (uint256) {
        return uint256(keccak256(abi.encode(collateralToken, collectionId)));
    }
    
    function splitPosition(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        // Mock implementation - mint tokens to msg.sender
        for (uint256 i = 0; i < partition.length; i++) {
            bytes32 collectionId = this.getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = this.getPositionId(collateralToken, collectionId);
            _mint(msg.sender, positionId, amount, "");
        }
    }
    
    function redeemPositions(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets
    ) external {
        // Mock implementation - burn tokens and return collateral
        for (uint256 i = 0; i < indexSets.length; i++) {
            bytes32 collectionId = this.getCollectionId(parentCollectionId, conditionId, indexSets[i]);
            uint256 positionId = this.getPositionId(collateralToken, collectionId);
            uint256 balance = balanceOf(msg.sender, positionId);
            if (balance > 0) {
                _burn(msg.sender, positionId, balance);
            }
        }
    }
    
    function reportPayouts(
        bytes32 questionId,
        uint256[] calldata payouts
    ) external {
        // Mock implementation - just store the payouts
        // In real implementation, this would be handled by oracles
    }
}