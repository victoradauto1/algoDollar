// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./IOracleConsumer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IStableCoin.sol";

contract Rebase is IOracleConsumer, Ownable, Pausable {

    address public oracle;
    address public stableCoin;
    uint public lastUpdate; //timestamp
    uint private updateTolerance = 300; //secnonds

    mapping(address => uint) public ethBalance; //customer => wei balance

    constructor( address _oracle, address _stableCoin) Ownable(msg.sender) {
        oracle = _oracle;
        stableCoin = _stableCoin;
    }

    function initialize(uint weisPerPenny) external payable onlyOwner{
        require(weisPerPenny > 0, "Weis Ratio cannot be zero");
        require(msg.value >= weisPerPenny, "Value cannot be less than wei ratio");

        ethBalance[msg.sender] = msg.value;
        IStableCoin(stableCoin).mint(msg.sender, msg.value /weisPerPenny );
        lastUpdate = block.timestamp;
    }

    function setTolerance(uint toleranceInSeconds) external onlyOwner{
        require(toleranceInSeconds > 0, "Tolerance time cannot be zero");
        updateTolerance = toleranceInSeconds;
    }

    function setOracle(address newOracle) external onlyOwner{
        require( newOracle != address(0), "Oracle address cannot be zero");
        oracle = newOracle
    }

    function update(uint weisPerPenny) external {
        emit Updated(block.timestamp, 1, 1);
    }

    function pause() public onlyOwner {
        _pause;
    }

    function unPause() public onlyOwner{
        _unpause;
    }

    function deposit()external whenNotPaused whenNotOutDated{

    }

    function withdraw() external whenNotPaused whenNotOutDated{
        
    }


    modifier whenNotOutDated(){
        require(lastUpdate >= (block.timestamp - updateTolerance), "Rebase contract is paused. Try again later or contact the admin");
        _;
    }
}
