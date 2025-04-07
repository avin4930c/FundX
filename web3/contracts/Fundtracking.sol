// Create or modify this file: web3/contracts/Fundtracking.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FundAllocation {
    // Struct and enum definitions
    enum FundraiserStatus { Inactive, Active, Funded, Completed, Cancelled }
    
    struct Fundraiser {
        uint256 id;
        string name;
        string description;
        uint256 goal;
        uint256 raised;
        address creator;
        FundraiserStatus status;
    }
    
    struct WithdrawalRequest {
        uint256 fundraiserId;
        address to;
        uint256 amount;
        string reason;
        bool executed;
    }
    
    // State variables
    address[] public owners;
    uint256 public required;
    uint256 private fundraiserCount;
    mapping(uint256 => Fundraiser) public fundraisers;
    
    // Withdrawal requests
    WithdrawalRequest[] private withdrawalRequests;
    mapping(uint256 => address[]) private approvals;
    
    // Events
    event FundraiserCreated(uint256 indexed id, string name, address indexed creator, uint256 goal);
    event DonationReceived(uint256 indexed fundraiserId, address indexed donor, uint256 amount);
    event WithdrawalRequestCreated(uint256 indexed requestId, uint256 indexed fundraiserId, address to, uint256 amount);
    event WithdrawalApproved(uint256 indexed requestId, address indexed approver);
    event WithdrawalExecuted(uint256 indexed requestId, address to, uint256 amount);
    
    // Constructor
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number");
        
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            owners.push(owner);
        }
        required = _required;
    }
    
    // Fundraiser management
    function createFundraiser(string memory _name, string memory _description, uint256 _goal) external returns (uint256) {
        uint256 id = fundraiserCount;
        fundraisers[id] = Fundraiser({
            id: id,
            name: _name,
            description: _description,
            goal: _goal,
            raised: 0,
            creator: msg.sender,
            status: FundraiserStatus.Active
        });
        
        fundraiserCount++;
        emit FundraiserCreated(id, _name, msg.sender, _goal);
        return id;
    }
    
    // Critical getter function for frontend
    function getFundraiserCount() external view returns (uint256) {
        return fundraiserCount;
    }
    
    // Donation functionality
    function donate(uint256 _fundraiserId) external payable {
        require(_fundraiserId < fundraiserCount, "Fundraiser does not exist");
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.status == FundraiserStatus.Active, "Fundraiser not active");
        
        fundraiser.raised += msg.value;
        
        // Update status if goal reached
        if (fundraiser.raised >= fundraiser.goal) {
            fundraiser.status = FundraiserStatus.Funded;
        }
        
        emit DonationReceived(_fundraiserId, msg.sender, msg.value);
    }
    
    // Withdrawal request management
    function createWithdrawalRequest(uint256 _fundraiserId, string memory _reason, uint256 _amount) external returns (uint256) {
        require(_fundraiserId < fundraiserCount, "Fundraiser does not exist");
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.status == FundraiserStatus.Active || fundraiser.status == FundraiserStatus.Funded, 
                "Fundraiser not in valid state");
        require(_amount <= fundraiser.raised, "Insufficient funds");
        
        uint requestId = withdrawalRequests.length;
        withdrawalRequests.push(WithdrawalRequest({
            fundraiserId: _fundraiserId,
            to: msg.sender,
            amount: _amount,
            reason: _reason,
            executed: false
        }));
        
        emit WithdrawalRequestCreated(requestId, _fundraiserId, msg.sender, _amount);
        return requestId;
    }
    
    function getWithdrawalRequestCount() external view returns (uint256) {
        return withdrawalRequests.length;
    }
    
    function getWithdrawalRequest(uint256 _requestId) external view returns (WithdrawalRequest memory) {
        require(_requestId < withdrawalRequests.length, "Request does not exist");
        return withdrawalRequests[_requestId];
    }
    
    function getApprovers(uint256 _requestId) external view returns (address[] memory) {
        require(_requestId < withdrawalRequests.length, "Request does not exist");
        return approvals[_requestId];
    }
    
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    // Multi-sig functionality
    function approveWithdrawalRequest(uint256 _requestId) external {
        require(_requestId < withdrawalRequests.length, "Request does not exist");
        require(!withdrawalRequests[_requestId].executed, "Request already executed");
        require(isOwner(msg.sender), "Not an owner");
        require(!hasApproved(_requestId, msg.sender), "Already approved");
        
        approvals[_requestId].push(msg.sender);
        emit WithdrawalApproved(_requestId, msg.sender);
    }
    
    function executeWithdrawalRequest(uint256 _requestId) external {
        require(_requestId < withdrawalRequests.length, "Request does not exist");
        require(!withdrawalRequests[_requestId].executed, "Request already executed");
        require(approvals[_requestId].length >= required, "Not enough approvals");
        
        WithdrawalRequest storage request = withdrawalRequests[_requestId];
        request.executed = true;
        
        // Update fundraiser's raised amount
        Fundraiser storage fundraiser = fundraisers[request.fundraiserId];
        fundraiser.raised -= request.amount;
        
        // Transfer funds
        (bool success, ) = request.to.call{value: request.amount}("");
        require(success, "Transfer failed");
        
        emit WithdrawalExecuted(_requestId, request.to, request.amount);
    }
    
    // Helper functions
    function isOwner(address _address) internal view returns (bool) {
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == _address) {
                return true;
            }
        }
        return false;
    }
    
    function hasApproved(uint256 _requestId, address _owner) internal view returns (bool) {
        for (uint i = 0; i < approvals[_requestId].length; i++) {
            if (approvals[_requestId][i] == _owner) {
                return true;
            }
        }
        return false;
    }
}