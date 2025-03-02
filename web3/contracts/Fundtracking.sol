// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FundAllocation
 * @dev Contract for transparent tracking of fund allocations between government/NGOs and recipients
 */
contract FundAllocation {
    address public owner;
    uint public totalFunds;
    
    // Validator structure
    struct Validator {
        bool isActive;
        uint256 validationsCount;
    }
    
    // Project structure with validation
    struct Project {
        string name;
        string description;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool released;
        bool completed;
        uint256 validations;  // Number of validations received
        uint256 totalValidationWeight;  // Total weight of validations received
        uint256 validationStartTime;    // When validation period started
    }
    
    // Separate mapping for validation tracking
    mapping(uint256 => mapping(address => bool)) public projectValidations; // projectId => validator => hasValidated
    
    // Array to store all projects
    Project[] public projects;
    
    // Mapping for validators
    mapping(address => Validator) public validators;
    address[] public validatorList;
    
    // Number of validations required to approve a project
    uint256 public requiredValidations = 2;
    
    // Validation window in seconds (e.g., 24 hours)
    uint256 public validationWindow = 86400;
    
    // Minimum percentage of validators required (e.g., 70%)
    uint256 public requiredValidationPercentage = 70;
    
    // Validation weights (can be adjusted based on validator reputation)
    mapping(address => uint256) public validatorWeights;
    
    // Validation timestamps
    mapping(uint256 => uint256) public projectValidationStartTime;
    
    // Events for tracking activities
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ProjectValidated(uint256 indexed projectId, address indexed validator);
    event FundsAllocated(
        uint256 indexed projectId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string projectName,
        uint256 timestamp
    );
    event FundsReleased(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Only validators can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        // Add owner as the first validator
        _addValidator(msg.sender);
    }
    
    function _addValidator(address _validator) internal {
        validators[_validator] = Validator(true, 0);
        validatorList.push(_validator);
        emit ValidatorAdded(_validator);
    }
    
    function addValidator(address _validator) external onlyOwner {
        require(!validators[_validator].isActive, "Already a validator");
        _addValidator(_validator);
    }
    
    function removeValidator(address _validator) external onlyOwner {
        require(validators[_validator].isActive, "Not a validator");
        validators[_validator].isActive = false;
        emit ValidatorRemoved(_validator);
    }
    
    /**
     * @dev Allocate funds to a new project
     * @param _projectName Name of the project
     * @param _description Description of the project
     * @param _recipient Address of the recipient
     */
    function allocateFunds(
        string memory _projectName,
        string memory _description,
        address _recipient
    ) public payable {
        require(msg.value > 0, "Must send funds to allocate");
        require(_recipient != address(0), "Invalid recipient address");
        
        uint256 projectId = projects.length;
        projects.push(Project({
            name: _projectName,
            description: _description,
            recipient: _recipient,
            amount: msg.value,
            timestamp: block.timestamp,
            released: false,
            completed: false,
            validations: 0,
            totalValidationWeight: 0,
            validationStartTime: block.timestamp
        }));
        
        totalFunds += msg.value;
        
        emit FundsAllocated(
            projectId,
            msg.sender,
            _recipient,
            msg.value,
            _projectName,
            block.timestamp
        );
    }
    
    function validateProject(uint256 _projectId) external onlyValidator {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        
        // Check if within validation window
        require(
            block.timestamp <= project.validationStartTime + validationWindow,
            "Validation window closed"
        );
        
        require(!projectValidations[_projectId][msg.sender], "Already validated");
        
        // Add validation with weight
        uint256 validatorWeight = validatorWeights[msg.sender] > 0 ? 
            validatorWeights[msg.sender] : 1;
            
        projectValidations[_projectId][msg.sender] = true;
        project.validations++;
        project.totalValidationWeight += validatorWeight;
        validators[msg.sender].validationsCount++;
        
        emit ProjectValidated(_projectId, msg.sender);
        
        // Check if enough weighted validations received
        uint256 totalPossibleWeight = 0;
        for(uint i = 0; i < validatorList.length; i++) {
            totalPossibleWeight += validatorWeights[validatorList[i]] > 0 ? 
                validatorWeights[validatorList[i]] : 1;
        }
        
        uint256 validationPercentage = (project.totalValidationWeight * 100) / totalPossibleWeight;
        
        if (validationPercentage >= requiredValidationPercentage) {
            project.completed = true;
        }
    }
    
    /**
     * @dev Release funds to the recipient after project completion
     * @param _projectId ID of the project
     */
    function releaseFunds(uint256 _projectId) external onlyOwner {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(project.completed, "Project not completed");
        require(!project.released, "Funds already released");
        
        project.released = true;
        
        // Transfer funds to recipient
        (bool success, ) = project.recipient.call{value: project.amount}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(
            _projectId,
            project.recipient,
            project.amount,
            block.timestamp
        );
    }
    
    // View functions that return individual projects or simple arrays
    function getProjectCount() public view returns (uint256) {
        return projects.length;
    }
    
    function getProject(uint256 _projectId) public view returns (
        string memory name,
        string memory description,
        address recipient,
        uint256 amount,
        uint256 timestamp,
        bool released,
        bool completed,
        uint256 validations
    ) {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        return (
            project.name,
            project.description,
            project.recipient,
            project.amount,
            project.timestamp,
            project.released,
            project.completed,
            project.validations
        );
    }
    
    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }
    
    function hasValidated(uint256 _projectId, address _validator) public view returns (bool) {
        return projectValidations[_projectId][_validator];
    }
    
    /**
     * @dev Get contract balance
     * @return Current balance of the contract
     */
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // Function to set validator weights (only owner)
    function setValidatorWeight(address _validator, uint256 _weight) external onlyOwner {
        require(validators[_validator].isActive, "Not a validator");
        validatorWeights[_validator] = _weight;
    }

    // Function to adjust validation parameters (only owner)
    function setValidationParameters(
        uint256 _window,
        uint256 _percentage
    ) external onlyOwner {
        require(_percentage > 0 && _percentage <= 100, "Invalid percentage");
        validationWindow = _window;
        requiredValidationPercentage = _percentage;
    }
}