// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FundAllocation {
    address public owner;
    uint public totalFunds;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        totalFunds += msg.value;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}