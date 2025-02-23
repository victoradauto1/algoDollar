// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IOracleConsumer{

    event Updated(uint indexed timestamp, uint oldSupply, uint newSupply);

    function update(uint weisPerPenny) external;
}