// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Circle CCTP TokenMessenger Interface for Arc
interface ITokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 _nonce);
}

/**
 * @title StableBondsVault
 * @notice Enterprise-grade Fixed Income & Programmable Settlement on Arc
 */
contract StableBondsVault is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public usdc;
    ITokenMessenger public cctpMessenger;

    uint256 public nextBondId = 1;

    struct Intent {
        address supplier;
        uint32 destDomain;
        bool isConfigured;
    }

    struct Bond {
        address owner;
        uint256 principal;
        uint256 yieldBps; // e.g., 500 = 5.00%
        uint256 maturityDate;
        bool isSettled;
        Intent intent;
    }

    mapping(uint256 => Bond) public bonds;

    event BondCreated(uint256 indexed bondId, address indexed owner, uint256 maturityDate);
    event SettlementExecuted(uint256 indexed bondId, address indexed supplier, uint256 amount, uint64 cctpNonce);

    /**
     * @param _usdc Address of USDC on Arc Testnet (0x3600...)
     * @param _cctpMessenger Address of CCTP TokenMessenger on Arc Testnet
     */
    constructor(address _usdc, address _cctpMessenger) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        cctpMessenger = ITokenMessenger(_cctpMessenger);
    }

    /**
     * @notice Locks USDC and configures automated CCTP settlement intent
     * @param _amount USDC to lock (6 decimals)
     * @param _durationDays Lock duration
     * @param _supplier Target wallet on destination chain
     * @param _destDomain CCTP Domain ID (e.g., 3 for Arbitrum)
     */
    function createBondWithIntent(
        uint256 _amount,
        uint256 _durationDays,
        address _supplier,
        uint32 _destDomain
    ) external {
        require(_amount > 0, "Amount must be > 0");
        
        // Transfer USDC from user to this Vault (requires prior approve)
        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 bondId = nextBondId++;
        uint256 maturity = block.timestamp + (_durationDays * 1 days);
        
        bonds[bondId] = Bond({
            owner: msg.sender,
            principal: _amount,
            yieldBps: 500, // Fixed at 5% for MVP
            maturityDate: maturity,
            isSettled: false,
            intent: Intent({
                supplier: _supplier,
                destDomain: _destDomain,
                isConfigured: true
            })
        });

        emit BondCreated(bondId, msg.sender, maturity);
    }

    /**
     * @notice Triggered by an off-chain relayer (cronjob) exactly at maturity
     * @param _bondId ID of the bond to settle
     */
    function executeSettlement(uint256 _bondId) external {
        Bond storage bond = bonds[_bondId];
        require(!bond.isSettled, "Bond already settled");
        require(block.timestamp >= bond.maturityDate, "Bond not matured yet");
        
        bond.isSettled = true;

        // Simplified yield calculation (Principal * APY / 10000 * Days / 365)
        // Note: For MVP, we assume the vault holds enough extra yield to pay out
        uint256 yieldEarned = (bond.principal * bond.yieldBps) / 10000;

        // 1. Send Yield back to the original Treasury (Enterprise Owner)
        usdc.safeTransfer(bond.owner, yieldEarned);

        // 2. Prepare CCTP Burn to settle the Principal with the Supplier
        bytes32 mintRecipient = bytes32(uint256(uint160(bond.intent.supplier)));

        // 3. Approve TokenMessenger
        usdc.safeIncreaseAllowance(address(cctpMessenger), bond.principal);

        // 4. Burn & Route via CCTP
        uint64 nonce = cctpMessenger.depositForBurn(
            bond.principal,
            bond.intent.destDomain,
            mintRecipient,
            address(usdc)
        );

        emit SettlementExecuted(_bondId, bond.intent.supplier, bond.principal, nonce);
    }
}
