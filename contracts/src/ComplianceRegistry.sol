// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceRegistry
 * @notice Maintains KYC/KYB verification statuses and blacklist states for enterprise addresses
 */
contract ComplianceRegistry is Ownable {
    mapping(address => bool) public isVerified;
    mapping(address => bool) public isBlacklisted;

    event WalletVerified(address indexed user);
    event WalletUnverified(address indexed user);
    event WalletBlacklisted(address indexed user);
    event WalletUnblacklisted(address indexed user);

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @notice Marks a wallet address as KYC/KYB verified
     */
    function verifyWallet(address _user) external onlyOwner {
        isVerified[_user] = true;
        emit WalletVerified(_user);
    }

    /**
     * @notice Revokes KYC/KYB verification status for a wallet address
     */
    function unverifyWallet(address _user) external onlyOwner {
        isVerified[_user] = false;
        emit WalletUnverified(_user);
    }

    /**
     * @notice Blacklists a wallet address (sanctions check)
     */
    function blacklistWallet(address _user) external onlyOwner {
        isBlacklisted[_user] = true;
        emit WalletBlacklisted(_user);
    }

    /**
     * @notice Removes a wallet address from the blacklist
     */
    function unblacklistWallet(address _user) external onlyOwner {
        isBlacklisted[_user] = false;
        emit WalletUnblacklisted(_user);
    }
}
