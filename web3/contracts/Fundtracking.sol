// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FundAllocation
 * @dev Contract combining donation, fund allocation, DAO governance, multi-sig and proof-of-impact features
 */
contract FundAllocation {
    // ==================== State Variables ====================
    address public owner;
    uint public totalFunds;

    // DAO governance parameters
    uint256 public quorumPercentage = 51; // Percentage of validators needed for a proposal to pass
    uint256 public votingPeriod = 3 days; // Duration of voting period

    // Multi-sig parameters
    uint256 public requiredApprovals = 2; // Default number of approvals needed for withdrawal

    // ==================== Structs ====================
    // Validator/DAO member structure
    struct Validator {
        bool isActive;
        uint256 validationsCount;
        uint256 votingPower; // Voting power for DAO governance
    }

    // Fundraiser structure
    struct Fundraiser {
        string name;
        string description;
        address creator;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        bool active;
    }

    // Project structure with milestone-based release
    struct Project {
        string name;
        string description;
        address recipient;
        uint256 totalAmount;
        uint256 timestamp;
        bool completed;
        address[] approvers; // Multi-sig approvers
        uint256 requiredApprovals; // Multi-sig required approvals
        uint256 validations; // Number of validations received
        uint256 totalValidationWeight; // Total weight of validations received
        uint256 validationStartTime; // When validation period started
        // Proof of Impact - milestone-based release
        Milestone[] milestones;
        uint256 currentMilestone;
    }

    // Milestone structure for Proof-of-Impact
    struct Milestone {
        string description;
        uint256 amount; // Amount to release at this milestone
        bool validated; // Whether milestone is validated
        bool released; // Whether funds for this milestone are released
        uint256 votes; // Number of DAO votes received
    }

    // Withdrawal request for multi-sig
    struct WithdrawalRequest {
        uint256 projectId;
        uint256 milestoneId;
        uint256 amount;
        address[] approvedBy;
        bool executed;
        uint256 timestamp;
    }

    // DAO Proposal structure
    struct Proposal {
        uint256 projectId;
        uint256 milestoneId;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    // ==================== Mappings and Arrays ====================
    // Fundraisers
    Fundraiser[] public fundraisers;
    mapping(uint256 => mapping(address => uint256)) public donations; // fundraiserId => donor => amount

    // Projects
    Project[] public projects;
    mapping(uint256 => mapping(address => bool)) public projectValidations; // projectId => validator => hasValidated
    mapping(uint256 => mapping(uint256 => mapping(address => bool)))
        public milestoneValidations; // projectId => milestoneId => validator => hasValidated

    // Multi-signature withdrawals
    WithdrawalRequest[] public withdrawalRequests;

    // DAO proposals
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    // Validators / DAO members
    mapping(address => Validator) public validators;
    address[] public validatorList;

    // ==================== Events ====================
    // Fundraising events
    event FundraiserCreated(
        uint256 indexed fundraiserId,
        address indexed creator,
        string name,
        uint256 targetAmount
    );
    event DonationReceived(
        uint256 indexed fundraiserId,
        address indexed donor,
        uint256 amount
    );

    // Project events
    event ProjectCreated(
        uint256 indexed projectId,
        string name,
        address recipient
    );
    event MilestoneCreated(
        uint256 indexed projectId,
        uint256 milestoneId,
        string description,
        uint256 amount
    );
    event ProjectValidated(
        uint256 indexed projectId,
        address indexed validator
    );
    event MilestoneValidated(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        address indexed validator
    );

    // Multi-sig events
    event WithdrawalRequested(
        uint256 indexed requestId,
        uint256 projectId,
        uint256 milestoneId,
        uint256 amount
    );
    event WithdrawalApproved(
        uint256 indexed requestId,
        address indexed approver
    );
    event WithdrawalExecuted(
        uint256 indexed requestId,
        address indexed recipient,
        uint256 amount
    );

    // DAO events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string description
    );
    event ProposalVoted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    event ProposalExecuted(uint256 indexed proposalId);

    // ==================== Modifiers ====================
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Not validator");
        _;
    }

    modifier onlyProjectCreator(uint256 _projectId) {
        require(_projectId < projects.length, "Invalid project");
        require(msg.sender == projects[_projectId].recipient, "Not creator");
        _;
    }

    // ==================== Constructor ====================
    constructor() {
        owner = msg.sender;
        // Add owner as the first validator
        _addValidator(msg.sender);
    }

    // ==================== Validator Management ====================
    function _addValidator(address _validator) internal {
        validators[_validator] = Validator(true, 0, 1); // Default voting power is 1
        validatorList.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function addValidator(address _validator) external onlyOwner {
        require(!validators[_validator].isActive, "Already validator");
        _addValidator(_validator);
    }

    function removeValidator(address _validator) external onlyOwner {
        require(validators[_validator].isActive, "Not validator");
        validators[_validator].isActive = false;
        emit ValidatorRemoved(_validator);
    }

    function setValidatorVotingPower(
        address _validator,
        uint256 _power
    ) external onlyOwner {
        require(validators[_validator].isActive, "Not validator");
        validators[_validator].votingPower = _power;
    }

    // ==================== Donation Functions ====================
    function createFundraiser(
        string memory _name,
        string memory _description,
        uint256 _targetAmount,
        uint256 _durationInDays
    ) external returns (uint256) {
        uint256 fundraiserId = fundraisers.length;

        fundraisers.push(
            Fundraiser({
                name: _name,
                description: _description,
                creator: msg.sender,
                targetAmount: _targetAmount,
                currentAmount: 0,
                deadline: block.timestamp + (_durationInDays * 1 days),
                active: true
            })
        );

        emit FundraiserCreated(fundraiserId, msg.sender, _name, _targetAmount);
        return fundraiserId;
    }

    function donate(uint256 _fundraiserId) external payable {
        require(_fundraiserId < fundraisers.length, "Invalid fundraiser");
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];

        require(fundraiser.active, "Not active");
        require(block.timestamp < fundraiser.deadline, "Ended");
        require(msg.value > 0, "No value");

        fundraiser.currentAmount += msg.value;
        donations[_fundraiserId][msg.sender] += msg.value;

        emit DonationReceived(_fundraiserId, msg.sender, msg.value);

        // If target reached, convert to project
        if (fundraiser.currentAmount >= fundraiser.targetAmount) {
            fundraiser.active = false;
            _createProjectFromFundraiser(_fundraiserId);
        }
    }

    function _createProjectFromFundraiser(uint256 _fundraiserId) internal {
        Fundraiser storage fundraiser = fundraisers[_fundraiserId];
        uint256 projectId = projects.length;

        // Create initial project
        Project storage newProject = projects.push();
        newProject.name = fundraiser.name;
        newProject.description = fundraiser.description;
        newProject.recipient = fundraiser.creator;
        newProject.totalAmount = fundraiser.currentAmount;
        newProject.timestamp = block.timestamp;
        newProject.completed = false;
        newProject.validationStartTime = block.timestamp;
        newProject.approvers = new address[](0);
        newProject.requiredApprovals = requiredApprovals;
        newProject.currentMilestone = 0;

        // Create a default milestone with all funds
        Milestone memory initialMilestone = Milestone({
            description: "Initial release",
            amount: fundraiser.currentAmount,
            validated: false,
            released: false,
            votes: 0
        });

        newProject.milestones.push(initialMilestone);

        totalFunds += fundraiser.currentAmount;

        emit ProjectCreated(projectId, fundraiser.name, fundraiser.creator);
        emit MilestoneCreated(
            projectId,
            0,
            "Initial release",
            fundraiser.currentAmount
        );
    }

    // ==================== Project Management ====================
    function createProjectWithMilestones(
        string memory _name,
        string memory _description,
        address _recipient,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts
    ) external payable {
        require(msg.value > 0, "No value");
        require(_recipient != address(0), "Invalid recipient");
        require(
            _milestoneDescriptions.length == _milestoneAmounts.length,
            "Array mismatch"
        );
        require(_milestoneDescriptions.length > 0, "No milestones");

        uint256 totalMilestoneAmount = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            totalMilestoneAmount += _milestoneAmounts[i];
        }
        require(totalMilestoneAmount == msg.value, "Amount mismatch");

        uint256 projectId = projects.length;

        // Create project
        Project storage newProject = projects.push();
        newProject.name = _name;
        newProject.description = _description;
        newProject.recipient = _recipient;
        newProject.totalAmount = msg.value;
        newProject.timestamp = block.timestamp;
        newProject.completed = false;
        newProject.validationStartTime = block.timestamp;
        newProject.approvers = new address[](0);
        newProject.requiredApprovals = requiredApprovals;
        newProject.currentMilestone = 0;

        // Create milestones
        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            Milestone memory milestone = Milestone({
                description: _milestoneDescriptions[i],
                amount: _milestoneAmounts[i],
                validated: false,
                released: false,
                votes: 0
            });

            newProject.milestones.push(milestone);
            emit MilestoneCreated(
                projectId,
                i,
                _milestoneDescriptions[i],
                _milestoneAmounts[i]
            );
        }

        totalFunds += msg.value;

        emit ProjectCreated(projectId, _name, _recipient);
    }

    function addProjectApprover(
        uint256 _projectId,
        address _approver
    ) external onlyProjectCreator(_projectId) {
        Project storage project = projects[_projectId];

        for (uint256 i = 0; i < project.approvers.length; i++) {
            if (project.approvers[i] == _approver) {
                revert("Already approver");
            }
        }

        project.approvers.push(_approver);
    }

    function setProjectRequiredApprovals(
        uint256 _projectId,
        uint256 _requiredApprovals
    ) external onlyProjectCreator(_projectId) {
        Project storage project = projects[_projectId];
        require(
            _requiredApprovals > 0 &&
                _requiredApprovals <= project.approvers.length,
            "Invalid value"
        );
        project.requiredApprovals = _requiredApprovals;
    }

    // ==================== Validation Functions ====================
    function validateProject(uint256 _projectId) external onlyValidator {
        require(_projectId < projects.length, "Invalid project");
        Project storage project = projects[_projectId];

        require(
            !projectValidations[_projectId][msg.sender],
            "Already validated"
        );

        // Add validation with voting power
        uint256 validatorWeight = validators[msg.sender].votingPower;

        projectValidations[_projectId][msg.sender] = true;
        project.validations++;
        project.totalValidationWeight += validatorWeight;
        validators[msg.sender].validationsCount++;

        emit ProjectValidated(_projectId, msg.sender);

        // Check if enough weighted validations received
        uint256 totalPossibleWeight = 0;
        for (uint i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                totalPossibleWeight += validators[validatorList[i]].votingPower;
            }
        }

        uint256 validationPercentage = (project.totalValidationWeight * 100) /
            totalPossibleWeight;

        if (validationPercentage >= quorumPercentage) {
            project.completed = true;
            // Enable the first milestone for validation
            if (project.milestones.length > 0) {
                _createMilestoneProposal(
                    _projectId,
                    0,
                    "Validate initial milestone"
                );
            }
        }
    }

    // ==================== DAO Governance Functions ====================
    function _createMilestoneProposal(
        uint256 _projectId,
        uint256 _milestoneId,
        string memory _description
    ) internal {
        uint256 proposalId = proposalCount++;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.projectId = _projectId;
        newProposal.milestoneId = _milestoneId;
        newProposal.description = _description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;

        emit ProposalCreated(proposalId, msg.sender, _description);
    }

    function createMilestoneProposal(
        uint256 _projectId,
        uint256 _milestoneId,
        string memory _description
    ) external onlyValidator {
        require(_projectId < projects.length, "Invalid project");
        Project storage project = projects[_projectId];
        require(project.completed, "Not completed");
        require(_milestoneId < project.milestones.length, "Invalid milestone");
        require(project.currentMilestone == _milestoneId, "Not current");
        require(
            !project.milestones[_milestoneId].validated,
            "Already validated"
        );

        _createMilestoneProposal(_projectId, _milestoneId, _description);
    }

    function vote(uint256 _proposalId, bool _support) external onlyValidator {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp >= proposal.startTime, "Not started");
        require(block.timestamp <= proposal.endTime, "Ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        proposal.hasVoted[msg.sender] = true;

        uint256 votingPower = validators[msg.sender].votingPower;

        if (_support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }

        emit ProposalVoted(_proposalId, msg.sender, _support);

        // Check if can be executed immediately
        _checkAndExecuteProposal(_proposalId);
    }

    function _checkAndExecuteProposal(uint256 _proposalId) internal {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.executed) {
            return;
        }

        // Calculate total votes
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;

        // Calculate total possible votes
        uint256 totalPossibleVotes = 0;
        for (uint i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                totalPossibleVotes += validators[validatorList[i]].votingPower;
            }
        }

        // Check if enough votes and majority support
        bool quorumReached = (totalVotes * 100) / totalPossibleVotes >=
            quorumPercentage;
        bool majoritySupport = proposal.forVotes > proposal.againstVotes;

        if (quorumReached && majoritySupport) {
            _executeProposal(_proposalId);
        }
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp > proposal.endTime, "Not ended");
        require(!proposal.executed, "Already executed");

        _checkAndExecuteProposal(_proposalId);
    }

    function _executeProposal(uint256 _proposalId) internal {
        Proposal storage proposal = proposals[_proposalId];
        Project storage project = projects[proposal.projectId];
        Milestone storage milestone = project.milestones[proposal.milestoneId];

        // Mark milestone as validated
        milestone.validated = true;
        milestone.votes = proposal.forVotes;

        // Mark proposal as executed
        proposal.executed = true;

        emit ProposalExecuted(_proposalId);

        // Create withdrawal request
        _createWithdrawalRequest(
            proposal.projectId,
            proposal.milestoneId,
            milestone.amount
        );
    }

    // ==================== Multi-Signature Functions ====================
    function _createWithdrawalRequest(
        uint256 _projectId,
        uint256 _milestoneId,
        uint256 _amount
    ) internal {
        uint256 requestId = withdrawalRequests.length;
        withdrawalRequests.push(
            WithdrawalRequest({
                projectId: _projectId,
                milestoneId: _milestoneId,
                amount: _amount,
                approvedBy: new address[](0),
                executed: false,
                timestamp: block.timestamp
            })
        );

        emit WithdrawalRequested(requestId, _projectId, _milestoneId, _amount);
    }

    function approveWithdrawal(uint256 _requestId) external {
        require(_requestId < withdrawalRequests.length, "Invalid request");
        WithdrawalRequest storage request = withdrawalRequests[_requestId];
        require(!request.executed, "Already executed");

        Project storage project = projects[request.projectId];

        // Check if the caller is an approver
        bool isApprover = false;
        for (uint256 i = 0; i < project.approvers.length; i++) {
            if (project.approvers[i] == msg.sender) {
                isApprover = true;
                break;
            }
        }

        // If project has no approvers, validators can approve
        if (project.approvers.length == 0) {
            require(validators[msg.sender].isActive, "Not validator");
            isApprover = true;
        } else {
            require(isApprover, "Not approver");
        }

        // Check if already approved
        for (uint256 i = 0; i < request.approvedBy.length; i++) {
            if (request.approvedBy[i] == msg.sender) {
                revert("Already approved");
            }
        }

        // Add approval
        request.approvedBy.push(msg.sender);
        emit WithdrawalApproved(_requestId, msg.sender);

        // Check if can be executed
        if (request.approvedBy.length >= project.requiredApprovals) {
            _executeWithdrawal(_requestId);
        }
    }

    function _executeWithdrawal(uint256 _requestId) internal {
        WithdrawalRequest storage request = withdrawalRequests[_requestId];
        Project storage project = projects[request.projectId];
        Milestone storage milestone = project.milestones[request.milestoneId];

        require(!request.executed, "Already executed");
        require(milestone.validated, "Not validated");
        require(!milestone.released, "Already released");

        request.executed = true;
        milestone.released = true;

        // Transfer funds to recipient
        (bool success, ) = project.recipient.call{value: request.amount}("");
        require(success, "Transfer failed");

        // Update current milestone
        if (project.currentMilestone < project.milestones.length - 1) {
            project.currentMilestone++;
        }

        emit WithdrawalExecuted(_requestId, project.recipient, request.amount);
    }

    // ==================== View Functions ====================
    function getFundraiserCount() public view returns (uint256) {
        return fundraisers.length;
    }

    function getProjectCount() public view returns (uint256) {
        return projects.length;
    }

    function getMilestoneCount(
        uint256 _projectId
    ) public view returns (uint256) {
        require(_projectId < projects.length, "Invalid project");
        return projects[_projectId].milestones.length;
    }

    function getMilestone(
        uint256 _projectId,
        uint256 _milestoneId
    )
        public
        view
        returns (
            string memory description,
            uint256 amount,
            bool validated,
            bool released,
            uint256 votes
        )
    {
        require(_projectId < projects.length, "Invalid project");
        require(
            _milestoneId < projects[_projectId].milestones.length,
            "Invalid milestone"
        );

        Milestone storage milestone = projects[_projectId].milestones[
            _milestoneId
        ];
        return (
            milestone.description,
            milestone.amount,
            milestone.validated,
            milestone.released,
            milestone.votes
        );
    }

    function getWithdrawalRequestCount() public view returns (uint256) {
        return withdrawalRequests.length;
    }

    function getWithdrawalApprovers(
        uint256 _requestId
    ) public view returns (address[] memory) {
        require(_requestId < withdrawalRequests.length, "Invalid request");
        return withdrawalRequests[_requestId].approvedBy;
    }

    function getProjectApprovers(
        uint256 _projectId
    ) public view returns (address[] memory) {
        require(_projectId < projects.length, "Invalid project");
        return projects[_projectId].approvers;
    }

    function getValidators() public view returns (address[] memory) {
        return validatorList;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Missing events declared earlier
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
}
