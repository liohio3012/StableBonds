// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./StableBondsVault.sol";

/**
 * @title StableBondsOTC
 * @notice Handles decentralized, peer-to-peer OTC listings and purchases of tokenized StableBonds.
 *         Ensures both sellers and buyers are KYC/KYB verified via the compliance registry.
 */
contract StableBondsOTC is ERC1155Holder, Ownable {
    using SafeERC20 for IERC20;

    struct Order {
        uint256 orderId;
        uint256 bondId;
        address seller;
        uint256 price; // USDC amount wanted (6 decimals)
        bool isActive;
    }

    StableBondsVault public vault;
    uint256 public nextOrderId = 1;
    uint256 public feeBps = 20; // 0.20% protocol fee

    mapping(uint256 => Order) public orders;
    mapping(uint256 => uint256) public bondToActiveOrder;

    event OrderListed(uint256 indexed orderId, uint256 indexed bondId, address indexed seller, uint256 price);
    event OrderCancelled(uint256 indexed orderId, uint256 indexed bondId);
    event OrderFilled(uint256 indexed orderId, uint256 indexed bondId, address indexed buyer, uint256 price);
    event FeeBpsUpdated(uint256 newFeeBps);

    constructor(address _vault) Ownable(msg.sender) {
        vault = StableBondsVault(_vault);
    }

    /**
     * @notice Allows contract owner to update the transaction fee (max 5.00%)
     */
    function setFeeBps(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 500, "Fee cannot exceed 5%");
        feeBps = _newFeeBps;
        emit FeeBpsUpdated(_newFeeBps);
    }

    /**
     * @notice Lists a tokenized bond for sale on the OTC desk, transferring ownership to this contract as escrow.
     * @param _bondId ID of the bond (ERC-1155 token ID)
     * @param _price Price in USDC wanted for the bond
     */
    function listBondForSale(uint256 _bondId, uint256 _price) external {
        require(vault.balanceOf(msg.sender, _bondId) == 1, "Must own the bond token");
        require(bondToActiveOrder[_bondId] == 0, "Bond already listed");
        require(_price > 0, "Price must be > 0");

        // Escrow the ERC-1155 bond token into the OTC contract
        vault.safeTransferFrom(msg.sender, address(this), _bondId, 1, "");

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            orderId: orderId,
            bondId: _bondId,
            seller: msg.sender,
            price: _price,
            isActive: true
        });
        bondToActiveOrder[_bondId] = orderId;

        emit OrderListed(orderId, _bondId, msg.sender, _price);
    }

    /**
     * @notice Cancels an active OTC listing and returns the escrowed bond token to the seller.
     */
    function cancelOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.isActive, "Order not active");
        require(msg.sender == order.seller, "Not the seller");

        order.isActive = false;
        bondToActiveOrder[order.bondId] = 0;

        // Return the ERC-1155 token to the seller
        vault.safeTransferFrom(address(this), order.seller, order.bondId, 1, "");

        emit OrderCancelled(_orderId, order.bondId);
    }

    /**
     * @notice Purchases a listed bond, routing USDC (minus fee) to the seller and the bond token to the buyer.
     */
    function fillOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.isActive, "Order not active");

        // Compliance checks for buyer
        require(vault.complianceRegistry().isVerified(msg.sender), "Buyer not verified");
        require(!vault.complianceRegistry().isBlacklisted(msg.sender), "Buyer blacklisted");

        order.isActive = false;
        bondToActiveOrder[order.bondId] = 0;

        // Calculate and distribute fee
        uint256 fee = (order.price * feeBps) / 10000;
        uint256 sellerAmount = order.price - fee;

        IERC20 usdc = vault.usdc();

        if (fee > 0) {
            usdc.safeTransferFrom(msg.sender, vault.owner(), fee);
        }
        usdc.safeTransferFrom(msg.sender, order.seller, sellerAmount);

        // Transfer the ERC-1155 bond token from escrow to the buyer
        vault.safeTransferFrom(address(this), msg.sender, order.bondId, 1, "");

        emit OrderFilled(_orderId, order.bondId, msg.sender, order.price);
    }
}
