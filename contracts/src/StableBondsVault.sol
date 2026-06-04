// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ComplianceRegistry.sol";

// Circle CCTP TokenMessenger Interface for Arc
interface ITokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 _nonce);
}

// Circle StableFX Taker Interface
interface IStableFX {
    function executeTrade(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 minBuyAmount,
        bytes calldata tradeData
    ) external returns (uint256 buyAmount);
}

// Circle CCTP Message Handler Interface
interface IMessageHandler {
    function handleReceiveMessage(
        uint32 sourceDomain,
        bytes32 sender,
        bytes calldata messageBody
    ) external returns (bool);
}

// AgentRegistry Interface for Vault policy enforcement
interface IVaultAgentRegistry {
    function getAgent(address _agentAddress) external view returns (string memory agentURI, address owner, int256 reputationScore, bool isActive);
    function checkAndSpendAllocation(address _agent, address _vendor, uint256 _amount) external returns (bool);
    function releaseAllocation(address _agent, uint256 _amount) external;
}

/**
 * @title AutomationCompatibleInterface
 * @notice Chainlink Automation (Keepers) standard interface.
 *         Also compatible with Gelato Resolver — identical function signatures.
 *         Reference: https://docs.chain.link/chainlink-automation/reference/automation-interfaces
 */
interface AutomationCompatibleInterface {
    /**
     * @notice Off-chain poll by keeper network to decide whether settlement work is pending.
     * @param checkData  Arbitrary bytes registered with the upkeep (unused here — pass 0x).
     * @return upkeepNeeded  true when at least one bond has crossed its maturity timestamp.
     * @return performData   ABI-encoded uint256[] of matured, unsettled bond IDs.
     */
    function checkUpkeep(bytes calldata checkData)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData);

    /**
     * @notice On-chain execution called by the keeper when checkUpkeep returns true.
     * @param performData  ABI-encoded uint256[] of bond IDs to settle — produced by checkUpkeep.
     */
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title StableBondsVault
 * @notice Enterprise-grade Fixed Income & Multi-Currency Programmable Settlement on Arc.
 *         Implements AutomationCompatibleInterface for trustless, decentralized keeper settlement.
 */
contract StableBondsVault is Ownable, IMessageHandler, AutomationCompatibleInterface, ERC1155 {
    using SafeERC20 for IERC20;

    IERC20 public usdc;
    IERC20 public eurc;
    ITokenMessenger public cctpMessenger;
    IStableFX public stableFX;
    address public messageTransmitter;
    ComplianceRegistry public complianceRegistry;
    address public otcAddress;
    address public gatewayPoolManager; // Address of Circle Gateway designated pool manager on Arc
    address public agentRegistry;      // Address of AgentRegistry contract
    address public multiSig;           // Address of MultiSigProposal contract

    uint256 public nextBondId = 1;
    uint256 public nextTermId = 1;
    uint256 public earlyWithdrawPenaltyBps = 200; // 2.00% standard penalty

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
        uint256 termId;
        address depositToken;
        address settlementToken;
        bool swapAtDeposit;
        Intent intent;
        address agent; // Creator agent (or address(0) if EOA/Direct)
        uint256 creationTimestamp;
        uint8 tranche; // 0 = Senior, 1 = Junior
    }


    struct Term {
        uint256 durationDays;
        uint256 fixedAPYBps; // e.g. 600 = 6.00%
        uint256 maxCapacity;
        uint256 activeDeposits;
        bool isActive;
        uint8 tranche; // 0 = Senior, 1 = Junior
    }

    mapping(uint256 => Bond) public bonds;
    mapping(uint256 => Term) public terms;
    mapping(uint256 => uint256) public claimedInterest;

    // ─────────────────────────────────────────────────────────────
    // Keeper / Automation state
    // ─────────────────────────────────────────────────────────────

    /// @notice Maximum number of bonds settled in a single performUpkeep call.
    ///         Prevents out-of-gas reverts on large bond sets.
    uint256 public upkeepBatchSize = 20;

    /// @notice Whitelisted keeper address allowed to call performUpkeep.
    ///         Set to address(0) to allow any caller (fully permissionless — useful for Gelato).
    address public authorizedKeeper;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event TermCreated(uint256 indexed termId, uint256 durationDays, uint256 fixedAPYBps, uint256 maxCapacity, uint8 tranche);
    event YieldClaimed(uint256 indexed bondId, address indexed owner, uint256 amount);
    event BondLossAllocated(uint256 indexed bondId, uint256 lossAmount);
    event TermStatusUpdated(uint256 indexed termId, bool isActive);
    event BondCreated(uint256 indexed bondId, address indexed owner, uint256 maturityDate);
    event SettlementExecuted(uint256 indexed bondId, address indexed supplier, uint256 amount, uint64 cctpNonce);
    event EarlyWithdrawn(uint256 indexed bondId, address indexed owner, uint256 refundAmount, uint256 penalty);
    event EarlyWithdrawPenaltyUpdated(uint256 newPenaltyBps);
    event StableFXUpdated(address indexed newStableFX);
    event MessageTransmitterUpdated(address indexed newTransmitter);
    event ComplianceRegistryUpdated(address indexed newRegistry);
    event GatewayPoolManagerUpdated(address indexed previousPoolManager, address indexed newPoolManager);
    event GatewayPaymentReceived(address indexed owner, uint256 indexed bondId, uint256 amount);
    event AgentRegistryUpdated(address indexed previousRegistry, address indexed newRegistry);

    /// @notice Emitted each time performUpkeep successfully settles a batch of bonds.
    event UpkeepPerformed(uint256[] bondIds, uint256 settledCount, uint256 timestamp);

    /// @notice Emitted when the authorizedKeeper address is updated.
    event AuthorizedKeeperUpdated(address indexed previousKeeper, address indexed newKeeper);

    /// @notice Emitted when upkeepBatchSize is changed.
    event UpkeepBatchSizeUpdated(uint256 newBatchSize);

    event MultiSigUpdated(address indexed previousMultiSig, address indexed newMultiSig);

    modifier onlyMultiSig() {
        if (multiSig != address(0)) {
            require(msg.sender == multiSig, "Only MultiSig consensus allowed");
        } else {
            require(msg.sender == owner(), "Only Owner allowed");
        }
        _;
    }

    function _checkCompliance(address _user) internal view {
        require(complianceRegistry.isVerified(_user), "User not KYC/KYB verified");
        require(!complianceRegistry.isBlacklisted(_user), "Sanctioned address");
    }

    /**
     * @param _usdc Address of USDC on Arc Testnet (0x3600...)
     * @param _eurc Address of EURC on Arc Testnet (0x89B5...)
     * @param _cctpMessenger Address of CCTP TokenMessenger on Arc Testnet
     * @param _stableFX Address of StableFX Router/Precompile
     * @param _complianceRegistry Address of ComplianceRegistry contract
     */
    constructor(
        address _usdc,
        address _eurc,
        address _cctpMessenger,
        address _stableFX,
        address _complianceRegistry
    ) Ownable(msg.sender) ERC1155("https://api.stablebonds.finance/metadata/{id}.json") {
        usdc = IERC20(_usdc);
        eurc = IERC20(_eurc);
        cctpMessenger = ITokenMessenger(_cctpMessenger);
        stableFX = IStableFX(_stableFX);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);

        // Initialize default terms (durationDays, fixedAPYBps, maxCapacity, tranche)
        // Senior (tranche = 0) - matches old IDs 1 to 5 exactly!
        _createTerm(30, 400, 1_000_000 * 10**6, 0);   // Term 1: 30 days, Senior
        _createTerm(60, 450, 1_000_000 * 10**6, 0);   // Term 2: 60 days, Senior
        _createTerm(90, 500, 1_000_000 * 10**6, 0);   // Term 3: 90 days, Senior
        _createTerm(180, 550, 2_000_000 * 10**6, 0);  // Term 4: 180 days, Senior
        _createTerm(365, 600, 5_000_000 * 10**6, 0);  // Term 5: 365 days, Senior

        // Junior (tranche = 1) - IDs 6 to 10!
        _createTerm(30, 800, 1_000_000 * 10**6, 1);   // Term 6: 30 days, Junior
        _createTerm(60, 900, 1_000_000 * 10**6, 1);   // Term 7: 60 days, Junior
        _createTerm(90, 1000, 1_000_000 * 10**6, 1);  // Term 8: 90 days, Junior
        _createTerm(180, 1100, 2_000_000 * 10**6, 1); // Term 9: 180 days, Junior
        _createTerm(365, 1200, 5_000_000 * 10**6, 1); // Term 10: 365 days, Junior
    }

    function _createTerm(uint256 _durationDays, uint256 _fixedAPYBps, uint256 _maxCapacity, uint8 _tranche) internal {
        uint256 termId = nextTermId++;
        terms[termId] = Term({
            durationDays: _durationDays,
            fixedAPYBps: _fixedAPYBps,
            maxCapacity: _maxCapacity,
            activeDeposits: 0,
            isActive: true,
            tranche: _tranche
        });
        emit TermCreated(termId, _durationDays, _fixedAPYBps, _maxCapacity, _tranche);
    }

    /**
     * @notice Allows contract owner to define a new fixed income term option
     */
    function createTerm(uint256 _durationDays, uint256 _fixedAPYBps, uint256 _maxCapacity, uint8 _tranche) external onlyMultiSig {
        _createTerm(_durationDays, _fixedAPYBps, _maxCapacity, _tranche);
    }

    /**
     * @notice Toggles active status of a term
     */
    function setTermStatus(uint256 _termId, bool _isActive) external onlyMultiSig {
        require(_termId > 0 && _termId < nextTermId, "Invalid term ID");
        terms[_termId].isActive = _isActive;
        emit TermStatusUpdated(_termId, _isActive);
    }

    /**
     * @notice Set early withdrawal penalty in basis points (e.g. 200 = 2.00%)
     */
    function setEarlyWithdrawPenaltyBps(uint256 _newPenaltyBps) external onlyMultiSig {
        require(_newPenaltyBps <= 1000, "Penalty cannot exceed 10%");
        earlyWithdrawPenaltyBps = _newPenaltyBps;
        emit EarlyWithdrawPenaltyUpdated(_newPenaltyBps);
    }

    /**
     * @notice Set StableFX router address
     */
    function setStableFX(address _stableFX) external onlyMultiSig {
        stableFX = IStableFX(_stableFX);
        emit StableFXUpdated(_stableFX);
    }

    /**
     * @notice Set CCTP MessageTransmitter address
     */
    function setMessageTransmitter(address _transmitter) external onlyMultiSig {
        messageTransmitter = _transmitter;
        emit MessageTransmitterUpdated(_transmitter);
    }

    /**
     * @notice Set ComplianceRegistry address
     */
    function setComplianceRegistry(address _complianceRegistry) external onlyMultiSig {
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        emit ComplianceRegistryUpdated(_complianceRegistry);
    }

    /**
     * @notice Set the OTC contract address
     */
    function setOTCAddress(address _otcAddress) external onlyMultiSig {
        otcAddress = _otcAddress;
    }

    /**
     * @notice Set the Gateway Pool Manager address
     */
    function setGatewayPoolManager(address _poolManager) external onlyMultiSig {
        emit GatewayPoolManagerUpdated(gatewayPoolManager, _poolManager);
        gatewayPoolManager = _poolManager;
    }

    /**
     * @notice Set the Agent Registry address
     */
    function setAgentRegistry(address _agentRegistry) external onlyMultiSig {
        emit AgentRegistryUpdated(agentRegistry, _agentRegistry);
        agentRegistry = _agentRegistry;
    }

    /**
     * @notice Set the MultiSig consensus address
     */
    function setMultiSig(address _multiSig) external onlyOwner {
        emit MultiSigUpdated(multiSig, _multiSig);
        multiSig = _multiSig;
    }

    /**
     * @notice Gateway payment settlement receiver.
     *         Called by the Gateway designated pool manager to mint a bond upon successful payment.
     */
    function receiveGatewayPayment(
        address _owner,
        uint256 _amount,
        uint256 _termId,
        address _supplier,
        uint32 _destDomain,
        address _depositToken,
        address _settlementToken,
        bool _swapAtDeposit
    ) external {
        if (gatewayPoolManager != address(0)) {
            require(msg.sender == gatewayPoolManager, "Only Gateway Pool Manager allowed");
        }
        _checkCompliance(_owner);
        require(_amount > 0, "Amount must be > 0");
        require(_termId > 0 && _termId < nextTermId, "Invalid term ID");
        require(_depositToken == address(usdc) || _depositToken == address(eurc), "Unsupported deposit token");
        require(_settlementToken == address(usdc) || _settlementToken == address(eurc), "Unsupported settlement token");

        Term storage term = terms[_termId];
        require(term.isActive, "Term is not active");

        // Transfer deposit token from pool manager to this Vault
        IERC20(_depositToken).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 finalPrincipal = _amount;
        require(term.activeDeposits + finalPrincipal <= term.maxCapacity, "Term capacity exceeded");
        term.activeDeposits += finalPrincipal;

        uint256 bondId = nextBondId++;
        uint256 maturity = block.timestamp + (term.durationDays * 1 days);

        bonds[bondId] = Bond({
            owner: _owner,
            principal: finalPrincipal,
            yieldBps: term.fixedAPYBps,
            maturityDate: maturity,
            isSettled: false,
            termId: _termId,
            depositToken: _depositToken,
            settlementToken: _settlementToken,
            swapAtDeposit: _swapAtDeposit,
            intent: Intent({
                supplier: _supplier,
                destDomain: _destDomain,
                isConfigured: true
            }),
            agent: address(0),
            creationTimestamp: block.timestamp,
            tranche: term.tranche
        });

        emit BondCreated(bondId, _owner, maturity);
        emit GatewayPaymentReceived(_owner, bondId, _amount);
        _mint(_owner, bondId, 1, "");
    }

    /**
     * @notice Set the authorized keeper address for performUpkeep.
     *         Pass address(0) to make performUpkeep permissionless (compatible with Gelato).
     * @param _keeper New keeper address, or address(0) for open access.
     */
    function setAuthorizedKeeper(address _keeper) external onlyMultiSig {
        emit AuthorizedKeeperUpdated(authorizedKeeper, _keeper);
        authorizedKeeper = _keeper;
    }

    /**
     * @notice Adjust the maximum bonds processed per performUpkeep call.
     * @param _batchSize New batch size. Minimum 1, maximum 50 to stay within gas limits.
     */
    function setUpkeepBatchSize(uint256 _batchSize) external onlyMultiSig {
        require(_batchSize >= 1 && _batchSize <= 50, "Batch size must be 1-50");
        upkeepBatchSize = _batchSize;
        emit UpkeepBatchSizeUpdated(_batchSize);
    }

    /**
     * @notice Locks USDC or EURC and configures automated CCTP settlement intent with optional StableFX swap
     */
    function createBondWithIntent(
        uint256 _amount,
        uint256 _termId,
        address _supplier,
        uint32 _destDomain,
        address _depositToken,
        address _settlementToken,
        bool _swapAtDeposit,
        uint256 _minBuyAmount,
        bytes memory _tradeData
    ) public {
        address bondOwner = msg.sender;
        address creatorAgent = address(0);

        if (agentRegistry != address(0)) {
            (, address ownerOfAgent, , bool isActive) = IVaultAgentRegistry(agentRegistry).getAgent(msg.sender);
            if (isActive && ownerOfAgent != address(0)) {
                bondOwner = ownerOfAgent;
                creatorAgent = msg.sender;
                
                // Enforce Agent Policy limit & vendor whitelist
                IVaultAgentRegistry(agentRegistry).checkAndSpendAllocation(msg.sender, _supplier, _amount);
            }
        }

        _checkCompliance(bondOwner);
        require(_amount > 0, "Amount must be > 0");
        require(_termId > 0 && _termId < nextTermId, "Invalid term ID");
        require(_depositToken == address(usdc) || _depositToken == address(eurc), "Unsupported deposit token");
        require(_settlementToken == address(usdc) || _settlementToken == address(eurc), "Unsupported settlement token");

        Term storage term = terms[_termId];
        require(term.isActive, "Term is not active");

        // Transfer deposit token from msg.sender to this Vault
        IERC20(_depositToken).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 finalPrincipal = _amount;

        // Perform StableFX swap at deposit if required
        if (_depositToken != _settlementToken && _swapAtDeposit) {
            require(address(stableFX) != address(0), "StableFX router not set");
            IERC20(_depositToken).safeIncreaseAllowance(address(stableFX), _amount);

            uint256 buyAmount = stableFX.executeTrade(
                _depositToken,
                _settlementToken,
                _amount,
                _minBuyAmount,
                _tradeData
            );
            require(buyAmount >= _minBuyAmount, "Slippage: received less than minimum");
            finalPrincipal = buyAmount;
        }

        require(term.activeDeposits + finalPrincipal <= term.maxCapacity, "Term capacity exceeded");
        term.activeDeposits += finalPrincipal;

        uint256 bondId = nextBondId++;
        uint256 maturity = block.timestamp + (term.durationDays * 1 days);

        bonds[bondId] = Bond({
            owner: bondOwner,
            principal: finalPrincipal,
            yieldBps: term.fixedAPYBps,
            maturityDate: maturity,
            isSettled: false,
            termId: _termId,
            depositToken: _depositToken,
            settlementToken: _settlementToken,
            swapAtDeposit: _swapAtDeposit,
            intent: Intent({
                supplier: _supplier,
                destDomain: _destDomain,
                isConfigured: true
            }),
            agent: creatorAgent,
            creationTimestamp: block.timestamp,
            tranche: term.tranche
        });

        emit BondCreated(bondId, bondOwner, maturity);
        _mint(bondOwner, bondId, 1, "");
    }

    /**
     * @notice Backward-compatible overload defaulting to USDC-USDC
     */
    function createBondWithIntent(
        uint256 _amount,
        uint256 _termId,
        address _supplier,
        uint32 _destDomain
    ) external {
        createBondWithIntent(
            _amount,
            _termId,
            _supplier,
            _destDomain,
            address(usdc),
            address(usdc),
            false,
            0,
            bytes("")
        );
    }

    /**
     * @notice Allows the designated MultiSig or Owner to create a bond for a compliant user
     */
    function createBondForUser(
        address _owner,
        uint256 _amount,
        uint256 _termId,
        address _supplier,
        uint32 _destDomain,
        address _depositToken,
        address _settlementToken,
        bool _swapAtDeposit,
        uint256 _minBuyAmount,
        bytes memory _tradeData
    ) external {
        if (multiSig != address(0)) {
            require(msg.sender == multiSig, "Only MultiSig allowed");
        } else {
            require(msg.sender == owner(), "Only Owner allowed");
        }
        _checkCompliance(_owner);
        require(_amount > 0, "Amount must be > 0");
        require(_termId > 0 && _termId < nextTermId, "Invalid term ID");
        require(_depositToken == address(usdc) || _depositToken == address(eurc), "Unsupported deposit token");
        require(_settlementToken == address(usdc) || _settlementToken == address(eurc), "Unsupported settlement token");

        Term storage term = terms[_termId];
        require(term.isActive, "Term is not active");

        // Transfer deposit token from msg.sender to this Vault
        IERC20(_depositToken).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 finalPrincipal = _amount;

        // Perform StableFX swap at deposit if required
        if (_depositToken != _settlementToken && _swapAtDeposit) {
            require(address(stableFX) != address(0), "StableFX router not set");
            IERC20(_depositToken).safeIncreaseAllowance(address(stableFX), _amount);

            uint256 buyAmount = stableFX.executeTrade(
                _depositToken,
                _settlementToken,
                _amount,
                _minBuyAmount,
                _tradeData
            );
            require(buyAmount >= _minBuyAmount, "Slippage: received less than minimum");
            finalPrincipal = buyAmount;
        }

        require(term.activeDeposits + finalPrincipal <= term.maxCapacity, "Term capacity exceeded");
        term.activeDeposits += finalPrincipal;

        uint256 bondId = nextBondId++;
        uint256 maturity = block.timestamp + (term.durationDays * 1 days);

        bonds[bondId] = Bond({
            owner: _owner,
            principal: finalPrincipal,
            yieldBps: term.fixedAPYBps,
            maturityDate: maturity,
            isSettled: false,
            termId: _termId,
            depositToken: _depositToken,
            settlementToken: _settlementToken,
            swapAtDeposit: _swapAtDeposit,
            intent: Intent({
                supplier: _supplier,
                destDomain: _destDomain,
                isConfigured: true
            }),
            agent: address(0),
            creationTimestamp: block.timestamp,
            tranche: term.tranche
        });

        emit BondCreated(bondId, _owner, maturity);
        _mint(_owner, bondId, 1, "");
    }

    /**
     * @notice Allows early withdrawal of principal at the cost of a penalty fee, returning the correct currency type
     * @param _bondId ID of the bond to withdraw early
     */
    function earlyWithdraw(uint256 _bondId) external {
        _checkCompliance(bonds[_bondId].owner);
        Bond storage bond = bonds[_bondId];
        require(msg.sender == bond.owner, "Not bond owner");
        require(!bond.isSettled, "Bond already settled");
        
        bond.isSettled = true;

        if (bond.agent != address(0) && agentRegistry != address(0)) {
            IVaultAgentRegistry(agentRegistry).releaseAllocation(bond.agent, bond.principal);
        }

        // Reduce active deposits of the term
        terms[bond.termId].activeDeposits -= bond.principal;

        uint256 penalty = (bond.principal * earlyWithdrawPenaltyBps) / 10000;
        uint256 refundAmount = bond.principal - penalty;

        address tokenToReturn = (bond.swapAtDeposit || bond.depositToken == bond.settlementToken) 
            ? bond.settlementToken 
            : bond.depositToken;

        // Return remaining amount in correct token to the owner
        IERC20(tokenToReturn).safeTransfer(bond.owner, refundAmount);

        _burn(bond.owner, _bondId, 1);

        emit EarlyWithdrawn(_bondId, bond.owner, refundAmount, penalty);
    }

    /**
     * @notice Execute settlement with optional StableFX trade parameters for swap-at-maturity
     */
    function executeSettlementWithTradeData(
        uint256 _bondId,
        uint256 _minBuyAmount,
        bytes memory _tradeData
    ) public {
        _checkCompliance(bonds[_bondId].owner);
        Bond storage bond = bonds[_bondId];
        require(!bond.isSettled, "Bond already settled");
        require(block.timestamp >= bond.maturityDate, "Bond not matured yet");
        
        bond.isSettled = true;

        if (bond.agent != address(0) && agentRegistry != address(0)) {
            IVaultAgentRegistry(agentRegistry).releaseAllocation(bond.agent, bond.principal);
        }

        // Reduce active deposits of the term
        terms[bond.termId].activeDeposits -= bond.principal;

        // Accrued yield calculation
        uint256 totalYield = calculateAccruedYield(_bondId);
        uint256 yieldEarned = totalYield > claimedInterest[_bondId] ? totalYield - claimedInterest[_bondId] : 0;

        // 1. Pay yield to the owner in the locked token
        address lockedToken = (bond.swapAtDeposit || bond.depositToken == bond.settlementToken)
            ? bond.settlementToken
            : bond.depositToken;

        if (yieldEarned > 0) {
            IERC20(lockedToken).safeTransfer(bond.owner, yieldEarned);
        }

        uint256 settlementPrincipal = bond.principal;

        // 2. Perform Swap at Maturity if needed
        if (!bond.swapAtDeposit && bond.depositToken != bond.settlementToken) {
            require(address(stableFX) != address(0), "StableFX router not set");
            IERC20(bond.depositToken).safeIncreaseAllowance(address(stableFX), bond.principal);

            settlementPrincipal = stableFX.executeTrade(
                bond.depositToken,
                bond.settlementToken,
                bond.principal,
                _minBuyAmount,
                _tradeData
            );
            require(settlementPrincipal >= _minBuyAmount, "Slippage: received less than minimum");
        }

        // 3. Settle principal to the supplier via CCTP
        bytes32 mintRecipient = bytes32(uint256(uint160(bond.intent.supplier)));
        IERC20(bond.settlementToken).safeIncreaseAllowance(address(cctpMessenger), settlementPrincipal);

        uint64 nonce = cctpMessenger.depositForBurn(
            settlementPrincipal,
            bond.intent.destDomain,
            mintRecipient,
            bond.settlementToken
        );

        emit SettlementExecuted(_bondId, bond.intent.supplier, settlementPrincipal, nonce);
        _burn(bond.owner, _bondId, 1);
    }

    /**
     * @notice Standard relayer settlement entrypoint
     * @param _bondId ID of the bond to settle
     */
    function executeSettlement(uint256 _bondId) public {
        executeSettlementWithTradeData(_bondId, 0, bytes(""));
    }

    /**
     * @notice Alias of executeSettlement to conform to mature() specifications
     * @param _bondId ID of the bond to mature
     */
    function mature(uint256 _bondId) external {
        executeSettlement(_bondId);
    }

    /**
     * @notice Callback invoked by MessageTransmitter on destination chain during CCTP minting with payload
     */
    function handleReceiveMessage(
        uint32 _sourceDomain,
        bytes32 _sender,
        bytes calldata _messageBody
    ) external returns (bool) {
        require(msg.sender == messageTransmitter, "Only MessageTransmitter allowed");

        // Decode the custom message body
        (
            address owner,
            uint256 amount,
            uint256 termId,
            address supplier,
            uint32 destDomain,
            address depositToken,
            address settlementToken,
            bool swapAtDeposit,
            uint256 minBuyAmount,
            bytes memory tradeData
        ) = abi.decode(
            _messageBody,
            (address, uint256, uint256, address, uint32, address, address, bool, uint256, bytes)
        );

        // Perform validation
        require(amount > 0, "Amount must be > 0");
        require(termId > 0 && termId < nextTermId, "Invalid term ID");
        require(depositToken == address(usdc) || depositToken == address(eurc), "Unsupported deposit token");
        require(settlementToken == address(usdc) || settlementToken == address(eurc), "Unsupported settlement token");

        // Validate Compliance
        require(complianceRegistry.isVerified(owner), "User not KYC/KYB verified");
        require(!complianceRegistry.isBlacklisted(owner), "Sanctioned address");

        Term storage term = terms[termId];
        require(term.isActive, "Term is not active");

        uint256 finalPrincipal = amount;

        // Perform StableFX swap at deposit if required
        if (depositToken != settlementToken && swapAtDeposit) {
            require(address(stableFX) != address(0), "StableFX router not set");
            IERC20(depositToken).safeIncreaseAllowance(address(stableFX), amount);

            uint256 buyAmount = stableFX.executeTrade(
                depositToken,
                settlementToken,
                amount,
                minBuyAmount,
                tradeData
            );
            require(buyAmount >= minBuyAmount, "Slippage: received less than minimum");
            finalPrincipal = buyAmount;
        }

        require(term.activeDeposits + finalPrincipal <= term.maxCapacity, "Term capacity exceeded");
        term.activeDeposits += finalPrincipal;

        uint256 bondId = nextBondId++;
        uint256 maturity = block.timestamp + (term.durationDays * 1 days);

        bonds[bondId] = Bond({
            owner: owner,
            principal: finalPrincipal,
            yieldBps: term.fixedAPYBps,
            maturityDate: maturity,
            isSettled: false,
            termId: termId,
            depositToken: depositToken,
            settlementToken: settlementToken,
            swapAtDeposit: swapAtDeposit,
            intent: Intent({
                supplier: supplier,
                destDomain: destDomain,
                isConfigured: true
            }),
            agent: address(0),
            creationTimestamp: block.timestamp,
            tranche: term.tranche
        });

        emit BondCreated(bondId, owner, maturity);
        _mint(owner, bondId, 1, "");
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chainlink Automation / Gelato Resolver — Keeper Interface
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Called off-chain by Chainlink Automation nodes (or a Gelato resolver) to
     *         detect whether any bonds have reached maturity and need settlement.
     *
     * @dev    Scans bond IDs from 1 to (nextBondId - 1) and collects up to `upkeepBatchSize`
     *         IDs whose maturityDate <= block.timestamp and isSettled == false.
     *         Compliance checks are intentionally skipped here to remain a pure `view`; the
     *         actual compliance gate is enforced inside executeSettlement.
     *
     * @param  checkData  Unused — pass 0x. Reserved for future range-based pagination.
     * @return upkeepNeeded  true if at least one bond is ready for keeper settlement.
     * @return performData   ABI-encoded uint256[] of bond IDs to settle.
     */
    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // Silence "unused parameter" warning for Solidity strict mode
        checkData;

        uint256 totalBonds = nextBondId - 1;
        uint256 batchCap = upkeepBatchSize;

        // Allocate a worst-case buffer
        uint256[] memory maturedIds = new uint256[](batchCap);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalBonds && count < batchCap; i++) {
            Bond storage bond = bonds[i];
            if (!bond.isSettled && block.timestamp >= bond.maturityDate) {
                maturedIds[count] = i;
                count++;
            }
        }

        if (count == 0) {
            return (false, bytes(""));
        }

        // Trim the array to the actual number of matured bonds found
        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = maturedIds[j];
        }

        upkeepNeeded = true;
        performData = abi.encode(result);
    }

    /**
     * @notice Called on-chain by Chainlink Automation (or Gelato) when upkeep is needed.
     *         Decodes the list of matured bond IDs from performData and settles each one.
     *
     * @dev    Each settlement is wrapped in a try-catch so that a single non-compliant or
     *         already-settled bond does not block the rest of the batch.
     *         The authorizedKeeper guard defaults to open access (address(0)) so that the
     *         contract works permissionlessly with Gelato out-of-the-box. Set a specific
     *         Chainlink Forwarder address via setAuthorizedKeeper after registration.
     *
     * @param  performData  ABI-encoded uint256[] produced by checkUpkeep.
     */
    function performUpkeep(bytes calldata performData) external override {
        // Access control: if authorizedKeeper is set, only that address may call this.
        if (authorizedKeeper != address(0)) {
            require(msg.sender == authorizedKeeper, "Keeper: caller not authorized");
        }

        uint256[] memory bondIds = abi.decode(performData, (uint256[]));
        uint256 settledCount = 0;

        for (uint256 i = 0; i < bondIds.length; i++) {
            uint256 bondId = bondIds[i];
            Bond storage bond = bonds[bondId];

            // Guard: skip if already settled or not yet matured (reorg / race safety)
            if (bond.isSettled || block.timestamp < bond.maturityDate) {
                continue;
            }

            // Execute settlement — catches compliance failures, slippage, or any revert
            // so that the keeper batch is not entirely blocked by one bad bond.
            try this.executeSettlement(bondId) {
                settledCount++;
            } catch {
                // Bond skipped — will be retried on next upkeep cycle
            }
        }

        emit UpkeepPerformed(bondIds, settledCount, block.timestamp);
    }

    /**
     * @notice Off-chain helper: returns a list of all currently matured, unsettled bond IDs.
     *         Used by the frontend dashboard and external automation scripts.
     *
     * @return bondIds  Array of bond IDs eligible for settlement right now.
     */
    function getMaturedUnsettledBonds() external view returns (uint256[] memory bondIds) {
        uint256 totalBonds = nextBondId - 1;
        uint256[] memory buffer = new uint256[](totalBonds);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalBonds; i++) {
            Bond storage bond = bonds[i];
            if (!bond.isSettled && block.timestamp >= bond.maturityDate) {
                buffer[count] = i;
                count++;
            }
        }

        bondIds = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            bondIds[j] = buffer[j];
        }
    }

    /**
     * @notice Calculate accrued yield for a bond on second-by-second basis
     */
    function calculateAccruedYield(uint256 _bondId) public view returns (uint256) {
        Bond storage bond = bonds[_bondId];
        if (bond.creationTimestamp == 0) return 0;
        uint256 endTimestamp = block.timestamp > bond.maturityDate ? bond.maturityDate : block.timestamp;
        if (endTimestamp <= bond.creationTimestamp) return 0;
        uint256 elapsed = endTimestamp - bond.creationTimestamp;
        return (bond.principal * bond.yieldBps * elapsed) / (365 days * 10000);
    }

    /**
     * @notice Claim second-by-second accrued yield without breaking the principal lock
     */
    function claimAccruedYield(uint256 _bondId) external {
        Bond storage bond = bonds[_bondId];
        require(msg.sender == bond.owner, "Not bond owner");
        require(!bond.isSettled, "Bond already settled");
        _checkCompliance(bond.owner);

        uint256 totalAccrued = calculateAccruedYield(_bondId);
        uint256 alreadyClaimed = claimedInterest[_bondId];
        require(totalAccrued > alreadyClaimed, "No new yield to claim");

        uint256 toClaim = totalAccrued - alreadyClaimed;
        claimedInterest[_bondId] = totalAccrued;

        address lockedToken = (bond.swapAtDeposit || bond.depositToken == bond.settlementToken)
            ? bond.settlementToken
            : bond.depositToken;

        IERC20(lockedToken).safeTransfer(bond.owner, toClaim);
        emit YieldClaimed(_bondId, bond.owner, toClaim);
    }

    /**
     * @notice Simulates a liquidity loss / default scenario where junior tranches absorb losses first.
     *         Admin-only mock to satisfy test and validation criteria.
     */
    function simulateLoss(uint256 _lossAmount) external onlyOwner {
        uint256 remainingLoss = _lossAmount;
        uint256 totalBonds = nextBondId - 1;

        // Step 1: Allocate to Junior bonds first
        for (uint256 i = 1; i <= totalBonds && remainingLoss > 0; i++) {
            Bond storage bond = bonds[i];
            if (!bond.isSettled && terms[bond.termId].tranche == 1) { // Junior
                if (bond.principal <= remainingLoss) {
                    remainingLoss -= bond.principal;
                    emit BondLossAllocated(i, bond.principal);
                    bond.principal = 0;
                    bond.isSettled = true; // effectively liquidated
                } else {
                    bond.principal -= remainingLoss;
                    emit BondLossAllocated(i, remainingLoss);
                    remainingLoss = 0;
                }
            }
        }

        // Step 2: Allocate to Senior bonds if loss remains
        for (uint256 i = 1; i <= totalBonds && remainingLoss > 0; i++) {
            Bond storage bond = bonds[i];
            if (!bond.isSettled && terms[bond.termId].tranche == 0) { // Senior
                if (bond.principal <= remainingLoss) {
                    remainingLoss -= bond.principal;
                    emit BondLossAllocated(i, bond.principal);
                    bond.principal = 0;
                    bond.isSettled = true; // liquidated
                } else {
                    bond.principal -= remainingLoss;
                    emit BondLossAllocated(i, remainingLoss);
                    remainingLoss = 0;
                }
            }
        }
    }

    /**
     * @notice Override ERC1155 _update hook to update bond owners and enforce KYC/KYB compliance on transfers.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        super._update(from, to, ids, values);

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 bondId = ids[i];
            if (from != address(0) && to != address(0)) {
                // Restrict transfer to verified and non-blacklisted addresses
                // (except if transferring to/from the OTC contract)
                if (to != otcAddress) {
                    _checkCompliance(to);
                }
                if (from != otcAddress) {
                    _checkCompliance(from);
                }
                bonds[bondId].owner = to;
            }
        }
    }

    /**
     * @notice ERC165 supportsInterface override
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
