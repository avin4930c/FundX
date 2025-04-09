// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FundAllocation {
    // Structs
    struct Milestone {
        string description;
        uint256 amount;
        string proof;
        bool proofSubmitted;
        bool approved;
        bool fundsReleased;
        bool requiresProof;  // Added flag to mark if proof is required for this milestone
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) hasVoted;
    }

    struct Fundraiser {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 targetAmount;
        uint256 raisedAmount;
        bool active;
        uint256 milestoneCount;
        uint256 currentMilestoneIndex;
        mapping(uint256 => Milestone) milestones;
        mapping(address => uint256) donations;
        mapping(address => bool) validators;  // Added validators mapping
        uint256 validatorCount;
    }

    // State variables
    uint256 private fundraiserCount;
    mapping(uint256 => Fundraiser) public fundraisers;
    
    // Events
    event FundraiserCreated(uint256 indexed id, address creator, string title, uint256 targetAmount);
    event DonationReceived(uint256 indexed fundraiserId, address donor, uint256 amount);
    event MilestoneCreated(uint256 indexed fundraiserId, uint256 milestoneIndex, string description, uint256 amount, bool requiresProof);
    event ValidatorAdded(uint256 indexed fundraiserId, address validator);
    event FundWithdrawalRequested(uint256 indexed fundraiserId, uint256 milestoneIndex);
    event ProofSubmitted(uint256 indexed fundraiserId, uint256 milestoneIndex, string proof);
    event MilestoneVoted(uint256 indexed fundraiserId, uint256 milestoneIndex, address validator, bool approved);
    event MilestoneApproved(uint256 indexed fundraiserId, uint256 milestoneIndex);
    event FundsReleased(uint256 indexed fundraiserId, uint256 milestoneIndex, uint256 amount);

    // Modifiers
    modifier fundraiserExists(uint256 _fundraiserId) {
        require(_fundraiserId < fundraiserCount, "Fundraiser does not exist");
        _;
    }

    modifier onlyFundraiserCreator(uint256 _fundraiserId) {
        require(msg.sender == fundraisers[_fundraiserId].creator, "Only creator can perform this action");
        _;
    }

    modifier onlyValidator(uint256 _fundraiserId) {
        require(fundraisers[_fundraiserId].validators[msg.sender], "Only validators can vote");
        _;
    }
    
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }
    
    // Re-entrancy guard
    bool private _locked;

    // Functions
    function createFundraiser(
        string memory _title,
        string memory _description,
        uint256 _targetAmount
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        
        uint256 fundraiserId = fundraiserCount++;
        Fundraiser storage newFundraiser = fundraisers[fundraiserId];
        
        newFundraiser.id = fundraiserId;
        newFundraiser.creator = msg.sender;
        newFundraiser.title = _title;
        newFundraiser.description = _description;
        newFundraiser.targetAmount = _targetAmount;
        newFundraiser.active = true;
        newFundraiser.currentMilestoneIndex = 0;
        
        // Add the creator as the first validator
        newFundraiser.validators[msg.sender] = true;
        newFundraiser.validatorCount = 1;
        
        emit FundraiserCreated(fundraiserId, msg.sender, _title, _targetAmount);
        emit ValidatorAdded(fundraiserId, msg.sender);
        
        return fundraiserId;
    }

    function addMilestone(
        uint256 _fundraiserId,
        string memory _description,
        uint256 _amount,
        bool _requiresProof
    ) external fundraiserExists(_fundraiserId) onlyFundraiserCreator(_fundraiserId) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 totalMilestoneAmount = getTotalMilestoneAmount(_fundraiserId);
        require(_amount <= fundraiser.targetAmount - totalMilestoneAmount, "Amount exceeds remaining target");

        uint256 milestoneIndex = fundraiser.milestoneCount;
        Milestone storage newMilestone = fundraiser.milestones[milestoneIndex];
        
        newMilestone.description = _description;
        newMilestone.amount = _amount;
        newMilestone.requiresProof = _requiresProof;  // Set whether this milestone requires proof
        fundraiser.milestoneCount++;
        
        emit MilestoneCreated(_fundraiserId, milestoneIndex, _description, _amount, _requiresProof);
    }

    function addValidator(
        uint256 _fundraiserId,
        address _validator
    ) external fundraiserExists(_fundraiserId) onlyFundraiserCreator(_fundraiserId) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        require(!fundraiser.validators[_validator], "Address is already a validator");
        require(_validator != address(0), "Invalid validator address");
        
        fundraiser.validators[_validator] = true;
        fundraiser.validatorCount++;
        
        emit ValidatorAdded(_fundraiserId, _validator);
    }

    function donate(uint256 _fundraiserId) external payable fundraiserExists(_fundraiserId) {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        
        // Prevent potential integer overflow
        uint256 newRaisedAmount = fundraiser.raisedAmount + msg.value;
        require(newRaisedAmount >= fundraiser.raisedAmount, "Integer overflow");
        
        fundraiser.raisedAmount = newRaisedAmount;
        fundraiser.donations[msg.sender] += msg.value;
        
        emit DonationReceived(_fundraiserId, msg.sender, msg.value);
    }

    function requestFundWithdrawal(
        uint256 _fundraiserId
    ) external fundraiserExists(_fundraiserId) onlyFundraiserCreator(_fundraiserId) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        
        uint256 currentIndex = fundraiser.currentMilestoneIndex;
        require(currentIndex < fundraiser.milestoneCount, "No more milestones");
        
        Milestone storage milestone = fundraiser.milestones[currentIndex];
        require(!milestone.approved, "Milestone already approved");
        require(!milestone.fundsReleased, "Funds already released");
        
        // For milestones that require proof, check that a previous milestone exists
        // and that the proof for the previous milestone has been submitted
        if (milestone.requiresProof) {
            require(currentIndex > 0, "First milestone doesn't require proof");
            
            // Check that the previous milestone has been completed
            uint256 previousIndex = currentIndex - 1;
            Milestone storage previousMilestone = fundraiser.milestones[previousIndex];
            require(previousMilestone.fundsReleased, "Previous milestone funds not released yet");
        }
        
        emit FundWithdrawalRequested(_fundraiserId, currentIndex);
    }

    function submitMilestoneProof(
        uint256 _fundraiserId,
        string memory _proof
    ) external fundraiserExists(_fundraiserId) onlyFundraiserCreator(_fundraiserId) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        require(bytes(_proof).length > 0, "Proof cannot be empty");
        
        uint256 currentIndex = fundraiser.currentMilestoneIndex;
        require(currentIndex < fundraiser.milestoneCount, "No more milestones");
        
        Milestone storage milestone = fundraiser.milestones[currentIndex];
        require(!milestone.proofSubmitted, "Proof already submitted");
        require(!milestone.approved, "Milestone already approved");
        require(!milestone.fundsReleased, "Funds already released");
        require(milestone.requiresProof, "This milestone doesn't require proof");
        
        milestone.proof = _proof;
        milestone.proofSubmitted = true;
        
        emit ProofSubmitted(_fundraiserId, currentIndex, _proof);
    }

    function validateMilestone(
        uint256 _fundraiserId,
        bool _approved
    ) external fundraiserExists(_fundraiserId) onlyValidator(_fundraiserId) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        
        uint256 currentIndex = fundraiser.currentMilestoneIndex;
        require(currentIndex < fundraiser.milestoneCount, "No more milestones");
        
        Milestone storage milestone = fundraiser.milestones[currentIndex];
        
        // Check if proof is required and submitted
        if (milestone.requiresProof) {
            require(milestone.proofSubmitted, "Proof not submitted yet");
        }
        
        require(!milestone.approved, "Milestone already approved");
        require(!milestone.fundsReleased, "Funds already released");
        require(!milestone.hasVoted[msg.sender], "Already voted");
        
        if (_approved) {
            milestone.yesVotes += 1;
        } else {
            milestone.noVotes += 1;
        }
        
        milestone.hasVoted[msg.sender] = true;
        emit MilestoneVoted(_fundraiserId, currentIndex, msg.sender, _approved);
        
        // Check if milestone is approved (majority of validators voted yes)
        if (milestone.yesVotes > fundraiser.validatorCount / 2) {
            milestone.approved = true;
            emit MilestoneApproved(_fundraiserId, currentIndex);
        }
    }

    function releaseMilestoneFunds(
        uint256 _fundraiserId
    ) external nonReentrant fundraiserExists(_fundraiserId) onlyFundraiserCreator(_fundraiserId) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        require(fundraiser.active, "Fundraiser is not active");
        
        uint256 currentIndex = fundraiser.currentMilestoneIndex;
        require(currentIndex < fundraiser.milestoneCount, "No more milestones");
        
        Milestone storage milestone = fundraiser.milestones[currentIndex];
        
        require(milestone.approved, "Milestone not approved");
        require(!milestone.fundsReleased, "Funds already released");
        require(fundraiser.raisedAmount >= milestone.amount, "Insufficient funds");
        
        // Update state before transfer to prevent re-entrancy attacks (Checks-Effects-Interactions pattern)
        milestone.fundsReleased = true;
        fundraiser.currentMilestoneIndex++;
        
        // Check if this was the last milestone
        if (fundraiser.currentMilestoneIndex >= fundraiser.milestoneCount) {
            fundraiser.active = false;
        }
        
        uint256 amountToSend = milestone.amount;
        address payable recipient = payable(fundraiser.creator);
        
        // Transfer funds to creator - after all state changes
        (bool success, ) = recipient.call{value: amountToSend}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(_fundraiserId, currentIndex, amountToSend);
    }

    // View functions
    function getFundraiserCount() external view returns (uint256) {
        return fundraiserCount;
    }

    function getFundraiserDetails(uint256 _fundraiserId) external view 
    fundraiserExists(_fundraiserId) 
    returns (
        address creator,
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 raisedAmount,
        bool active,
        uint256 milestoneCount,
        uint256 currentMilestoneIndex,
        uint256 validatorCount
    ) {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        return (
            fundraiser.creator,
            fundraiser.title,
            fundraiser.description,
            fundraiser.targetAmount,
            fundraiser.raisedAmount,
            fundraiser.active,
            fundraiser.milestoneCount,
            fundraiser.currentMilestoneIndex,
            fundraiser.validatorCount
        );
    }

    function getMilestone(uint256 _fundraiserId, uint256 _milestoneIndex) external view 
    fundraiserExists(_fundraiserId)
    returns (
        string memory description,
        uint256 amount,
        string memory proof,
        bool proofSubmitted,
        bool approved,
        bool fundsReleased,
        bool requiresProof,
        uint256 yesVotes,
        uint256 noVotes
    ) {
        require(_milestoneIndex < fundraisers[_fundraiserId].milestoneCount, "Milestone does not exist");
        Milestone storage milestone = fundraisers[_fundraiserId].milestones[_milestoneIndex];
        return (
            milestone.description,
            milestone.amount,
            milestone.proof,
            milestone.proofSubmitted,
            milestone.approved,
            milestone.fundsReleased,
            milestone.requiresProof,
            milestone.yesVotes,
            milestone.noVotes
        );
    }

    function getTotalMilestoneAmount(uint256 _fundraiserId) public view 
    fundraiserExists(_fundraiserId) 
    returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < fundraisers[_fundraiserId].milestoneCount; i++) {
            total += fundraisers[_fundraiserId].milestones[i].amount;
            // Check for overflow
            require(total >= fundraisers[_fundraiserId].milestones[i].amount, "Integer overflow");
        }
        return total;
    }

    function getDonorContribution(uint256 _fundraiserId, address _donor) external view 
    fundraiserExists(_fundraiserId) 
    returns (uint256) {
        return fundraisers[_fundraiserId].donations[_donor];
    }

    function isValidator(uint256 _fundraiserId, address _validator) external view 
    fundraiserExists(_fundraiserId) 
    returns (bool) {
        return fundraisers[_fundraiserId].validators[_validator];
    }

    function hasVoted(uint256 _fundraiserId, uint256 _milestoneIndex, address _validator) external view 
    fundraiserExists(_fundraiserId) 
    returns (bool) {
        require(_milestoneIndex < fundraisers[_fundraiserId].milestoneCount, "Milestone does not exist");
        return fundraisers[_fundraiserId].milestones[_milestoneIndex].hasVoted[_validator];
    }
}