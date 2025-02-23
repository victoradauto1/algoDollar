// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStableCoin is IERC20 {
    function mint(address to, uint amount) external;

    function burn(address from, uint amount) external;
}
