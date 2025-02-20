// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IOracle{

    event Subscribed(address indexed subscriber );
    event Unsubscribed(address indexed subscriber );
    event AllUpdated(address[] subscribers);

    function  setEthPrice(uint weisPerPenny) external ;

    function getWeiRate() external view returns(uint);

    function subscribe(address subscriber) external;

    function unsbscribe(address subscriber) external;
}