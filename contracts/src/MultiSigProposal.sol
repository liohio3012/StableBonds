// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStableBondsVault {
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
    ) external;

    function createTerm(uint256 _durationDays, uint256 _fixedAPYBps, uint256 _maxCapacity, uint8 _tranche) external;
    function setTermStatus(uint256 _termId, bool _isActive) external;
    function setGatewayPoolManager(address _poolManager) external;
    function setAgentRegistry(address _agentRegistry) external;
    function setAuthorizedKeeper(address _keeper) external;
    function setUpkeepBatchSize(uint256 _batchSize) external;
    function setEarlyWithdrawPenaltyBps(uint256 _newPenaltyBps) external;
}

contract MultiSigProposal {
    using SafeERC20 for IERC20;

    address[] public admins;
    uint256 public threshold;
    address public vault;

    mapping(address => bool) public isAdmin;

    struct Proposal {
        uint256 id;
        address proposer;
        uint256 amount;
        uint256 termId;
        address supplier;
        uint32 destDomain;
        address depositToken;
        address settlementToken;
        bool swapAtDeposit;
        uint256 minBuyAmount;
        bool executed;
        bool isBondProposal; // true if it is a bond purchase, false if it is a generic call
        address targetContract; // for generic call
    }

    uint256 public nextProposalId = 1;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => bytes) public proposalTradeData;
    mapping(uint256 => bytes) public proposalCallData;
    mapping(uint256 => uint256) public approvalsCount;
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    error ThresholdNotMet(uint256 currentApprovals, uint256 thresholdRequired);
    error SubcallFailed(bytes returnData);

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 amount, uint256 termId);
    event GenericProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed target, bytes data);
    event ProposalApproved(uint256 indexed proposalId, address indexed admin);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    constructor(address[] memory _admins, uint256 _threshold, address _vault) {
        require(_admins.length > 0, "At least one admin required");
        require(_threshold > 0 && _threshold <= _admins.length, "Invalid threshold");
        admins = _admins;
        threshold = _threshold;
        vault = _vault;
        for (uint256 i = 0; i < _admins.length; i++) {
            isAdmin[_admins[i]] = true;
        }
    }

    function proposeBond(
        uint256 _amount,
        uint256 _termId,
        address _supplier,
        uint32 _destDomain,
        address _depositToken,
        address _settlementToken,
        bool _swapAtDeposit,
        uint256 _minBuyAmount,
        bytes calldata _tradeData
    ) external returns (uint256) {
        // Escrow funds immediately from proposer into MultiSigProposal contract
        IERC20(_depositToken).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            amount: _amount,
            termId: _termId,
            supplier: _supplier,
            destDomain: _destDomain,
            depositToken: _depositToken,
            settlementToken: _settlementToken,
            swapAtDeposit: _swapAtDeposit,
            minBuyAmount: _minBuyAmount,
            executed: false,
            isBondProposal: true,
            targetContract: address(0)
        });
        proposalTradeData[proposalId] = _tradeData;

        emit ProposalCreated(proposalId, msg.sender, _amount, _termId);

        // Auto-approve by proposer if proposer is admin
        if (isAdmin[msg.sender]) {
            _approve(proposalId, msg.sender);
        }

        return proposalId;
    }

    function proposeAction(address _target, bytes calldata _data) external onlyAdmin returns (uint256) {
        uint256 proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            amount: 0,
            termId: 0,
            supplier: address(0),
            destDomain: 0,
            depositToken: address(0),
            settlementToken: address(0),
            swapAtDeposit: false,
            minBuyAmount: 0,
            executed: false,
            isBondProposal: false,
            targetContract: _target
        });
        proposalCallData[proposalId] = _data;

        emit GenericProposalCreated(proposalId, msg.sender, _target, _data);

        // Auto-approve by proposer
        _approve(proposalId, msg.sender);

        return proposalId;
    }

    function approveProposal(uint256 _proposalId) external onlyAdmin {
        _approve(_proposalId, msg.sender);
    }

    function _approve(uint256 _proposalId, address _admin) internal {
        Proposal storage prop = proposals[_proposalId];
        require(!prop.executed, "Proposal already executed");
        require(!hasApproved[_proposalId][_admin], "Admin already approved");

        hasApproved[_proposalId][_admin] = true;
        approvalsCount[_proposalId]++;

        emit ProposalApproved(_proposalId, _admin);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage prop = proposals[_proposalId];
        require(!prop.executed, "Proposal already executed");
        
        if (approvalsCount[_proposalId] < threshold) {
            revert ThresholdNotMet(approvalsCount[_proposalId], threshold);
        }

        prop.executed = true;

        if (prop.isBondProposal) {
            // Approve vault to pull escrowed tokens
            IERC20(prop.depositToken).safeIncreaseAllowance(vault, prop.amount);

            // Call createBondForUser on the Vault
            IStableBondsVault(vault).createBondForUser(
                prop.proposer,
                prop.amount,
                prop.termId,
                prop.supplier,
                prop.destDomain,
                prop.depositToken,
                prop.settlementToken,
                prop.swapAtDeposit,
                prop.minBuyAmount,
                proposalTradeData[_proposalId]
            );
        } else {
            // Execute generic call on behalf of the MultiSig contract
            (bool success, bytes memory returnData) = prop.targetContract.call(proposalCallData[_proposalId]);
            if (!success) {
                revert SubcallFailed(returnData);
            }
        }

        emit ProposalExecuted(_proposalId);
    }

    // View functions for frontend integration
    function getAdmins() external view returns (address[] memory) {
        return admins;
    }
}
