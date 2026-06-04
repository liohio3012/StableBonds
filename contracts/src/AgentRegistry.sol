// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// ERC-8004 Simple Identity Registry Interface
interface IERC8004Identity {
    event AgentRegistered(address indexed agentAddress, string agentURI, address indexed owner);
    event ReputationUpdated(address indexed agentAddress, int256 reputationScore);

    function registerAgent(address _agentAddress, string calldata _agentURI) external;
    function getAgent(address _agentAddress) external view returns (string memory agentURI, address owner, int256 reputationScore, bool isActive);
}

// ERC-8183 Simple Job Interface
interface IERC8183Job {
    enum JobStatus { Pending, Active, Completed, Rejected }

    struct Job {
        uint256 jobId;
        address client;
        address provider; // The agent
        uint256 budget;
        uint256 expiry;
        JobStatus status;
        string jobURI;
    }

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed provider, uint256 budget);
    event JobCompleted(uint256 indexed jobId, uint256 actualPayout);
    event JobRejected(uint256 indexed jobId);

    function createJob(address _provider, uint256 _budget, uint256 _expiry, string calldata _jobURI) external payable returns (uint256 jobId);
    function completeJob(uint256 _jobId, uint256 _actualPayout) external;
    function rejectJob(uint256 _jobId) external;
}

contract AgentRegistry is Ownable, IERC8004Identity, IERC8183Job {
    
    struct Agent {
        string agentURI;
        address owner;
        int256 reputationScore;
        bool isActive;
        // Spending Policies
        uint256 maxAllocationLimit; // Maximum total budget allowed for this agent (USDC/EURC equivalent in 6 decimals)
        uint256 currentAllocation;  // Current active allocation
    }

    uint256 public nextJobId = 1;
    
    mapping(address => Agent) private agents;
    mapping(uint256 => Job) public jobs;
    mapping(address => mapping(address => bool)) private whitelistedVendors;
    
    // Address of the StableBondsVault contract to interact with
    address public vault;

    event SpendingPolicyUpdated(address indexed agentAddress, uint256 maxAllocationLimit);
    event VendorWhitelistUpdated(address indexed agentAddress, address indexed vendor, bool whitelisted);

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    // ERC-8004 Registration
    function registerAgent(address _agentAddress, string calldata _agentURI) external override {
        require(_agentAddress != address(0), "Invalid agent address");
        agents[_agentAddress].agentURI = _agentURI;
        agents[_agentAddress].owner = msg.sender;
        agents[_agentAddress].reputationScore = 100; // base score
        agents[_agentAddress].isActive = true;
        agents[_agentAddress].maxAllocationLimit = 50000 * 10**6; // default 50k USDC limit

        emit AgentRegistered(_agentAddress, _agentURI, msg.sender);
        emit SpendingPolicyUpdated(_agentAddress, 50000 * 10**6);
    }

    function setAgentStatus(address _agentAddress, bool _isActive) external {
        require(agents[_agentAddress].owner == msg.sender || msg.sender == owner(), "Unauthorized");
        agents[_agentAddress].isActive = _isActive;
    }

    function updateReputation(address _agentAddress, int256 _scoreDelta) external onlyOwner {
        require(agents[_agentAddress].isActive, "Agent not active");
        agents[_agentAddress].reputationScore += _scoreDelta;
        emit ReputationUpdated(_agentAddress, agents[_agentAddress].reputationScore);
    }

    function setSpendingPolicy(address _agentAddress, uint256 _maxAllocationLimit) external {
        require(agents[_agentAddress].owner == msg.sender || msg.sender == owner(), "Unauthorized");
        agents[_agentAddress].maxAllocationLimit = _maxAllocationLimit;
        emit SpendingPolicyUpdated(_agentAddress, _maxAllocationLimit);
    }

    function setVendorWhitelist(address _agentAddress, address _vendor, bool _whitelisted) external {
        require(agents[_agentAddress].owner == msg.sender || msg.sender == owner(), "Unauthorized");
        whitelistedVendors[_agentAddress][_vendor] = _whitelisted;
        emit VendorWhitelistUpdated(_agentAddress, _vendor, _whitelisted);
    }

    function getAgent(address _agentAddress) external view override returns (
        string memory agentURI,
        address owner,
        int256 reputationScore,
        bool isActive
    ) {
        Agent storage agent = agents[_agentAddress];
        return (agent.agentURI, agent.owner, agent.reputationScore, agent.isActive);
    }

    function getAgentPolicy(address _agentAddress) external view returns (
        uint256 maxAllocationLimit,
        uint256 currentAllocation
    ) {
        Agent storage agent = agents[_agentAddress];
        return (agent.maxAllocationLimit, agent.currentAllocation);
    }

    function isVendorWhitelisted(address _agentAddress, address _vendor) public view returns (bool) {
        return whitelistedVendors[_agentAddress][_vendor];
    }

    // Spending policy check used by the vault
    function checkAndSpendAllocation(address _agent, address _vendor, uint256 _amount) external returns (bool) {
        require(msg.sender == vault, "Only vault can call");
        Agent storage agent = agents[_agent];
        require(agent.isActive, "Agent not active");
        require(whitelistedVendors[_agent][_vendor], "Vendor not whitelisted for agent");
        require(agent.currentAllocation + _amount <= agent.maxAllocationLimit, "Spending policy limit exceeded");
        
        agent.currentAllocation += _amount;
        return true;
    }

    function releaseAllocation(address _agent, uint256 _amount) external {
        require(msg.sender == vault, "Only vault can call");
        Agent storage agent = agents[_agent];
        if (agent.currentAllocation >= _amount) {
            agent.currentAllocation -= _amount;
        } else {
            agent.currentAllocation = 0;
        }
    }

    // ERC-8183 Job Escrow
    function createJob(
        address _provider,
        uint256 _budget,
        uint256 _expiry,
        string calldata _jobURI
    ) external payable override returns (uint256 jobId) {
        require(_provider != address(0), "Invalid provider");
        require(_expiry > block.timestamp, "Expiry must be in future");
        
        jobId = nextJobId++;
        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            provider: _provider,
            budget: _budget,
            expiry: _expiry,
            status: JobStatus.Active,
            jobURI: _jobURI
        });

        emit JobCreated(jobId, msg.sender, _provider, _budget);
    }

    function completeJob(uint256 _jobId, uint256 _actualPayout) external override {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job not active");
        require(msg.sender == job.client || msg.sender == owner(), "Unauthorized");
        
        job.status = JobStatus.Completed;
        emit JobCompleted(_jobId, _actualPayout);
    }

    function rejectJob(uint256 _jobId) external override {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job not active");
        require(msg.sender == job.client || msg.sender == owner(), "Unauthorized");
        
        job.status = JobStatus.Rejected;
        emit JobRejected(_jobId);
    }
}
