// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./IOracleConsumer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IStableCoin.sol";
import "./IOracle.sol";

contract Rebase is IOracleConsumer, Ownable, Pausable {
    address public oracle;
    address public stableCoin;
    uint public lastUpdate; //timestamp
    uint private updateTolerance = 300; //secnonds

    mapping(address => uint) public ethBalance; //customer => wei balance

    constructor(address _oracle, address _stableCoin) Ownable(msg.sender) {
        oracle = _oracle;
        stableCoin = _stableCoin;
    }

    function initialize(uint weisPerPenny) external payable onlyOwner {
        require(weisPerPenny > 0, "Weis Ratio cannot be zero");
        require(
            msg.value >= weisPerPenny,
            "Value cannot be less than wei ratio"
        );

        ethBalance[msg.sender] = msg.value;
        IStableCoin(stableCoin).mint(msg.sender, msg.value / weisPerPenny);
        lastUpdate = block.timestamp;
    }

    function setTolerance(uint toleranceInSeconds) external onlyOwner {
        require(toleranceInSeconds > 0, "Tolerance time cannot be zero");
        updateTolerance = toleranceInSeconds;
    }

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Oracle address cannot be zero");
        oracle = newOracle;
    }

    function update(uint weisPerPenny) external {
        require(msg.sender == oracle, "Only the oracle can make this call");
        uint oldSupply = IStableCoin(stableCoin).totalSupply();
        uint newSupply = adjustSupply(weisPerPenny);

        if(newSupply != 0){
            lastUpdate = block.timestamp;
            emit Updated(lastUpdate, oldSupply, newSupply);
        }

        
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unPause() public onlyOwner {
        _unpause();
    }

   function getParity(uint weisPerPenny) public view returns(uint) {
    if(weisPerPenny == 0) weisPerPenny = IOracle(oracle).getWeiRate();
    
    // zero division prevent
    uint totalSupply = IStableCoin(stableCoin).totalSupply();
    uint contractBalance = address(this).balance;
    
    if (contractBalance == 0 || totalSupply == 0 || weisPerPenny == 0) return 100;
   
    return (totalSupply * weisPerPenny * 100) / contractBalance;
}

    function adjustSupply(uint weisPerPenny) internal returns(uint) {
        uint parity = getParity(weisPerPenny);

        if(parity == 0){
            _pause();
            return 0;
        }

        IStableCoin algoDollar = IStableCoin(stableCoin);

        if(parity == 100){
            return algoDollar.totalSupply();
        }
        
      
        if(parity < 100) {
    
            uint mintAmount = (algoDollar.totalSupply() * (100 - parity)) / 100;
            algoDollar.mint(owner(), mintAmount);
        } else if(parity > 100) {

            uint burnAmount = (algoDollar.totalSupply() * (parity - 100)) / 100;
            algoDollar.burn(owner(), burnAmount);
        }

        return algoDollar.totalSupply();
    }

    function deposit() external payable whenNotPaused whenNotOutDated {
        uint weisPerPenny = IOracle(oracle).getWeiRate();
        require( msg.value >= weisPerPenny, "Insufficient deposit");

        ethBalance[msg.sender] = msg.value;
        uint tokens = msg.value / weisPerPenny;
        IStableCoin(stableCoin).mint(msg.sender, tokens);
    }

    function withdrawEth(uint amountEth) external payable whenNotPaused whenNotOutDated {
        require(ethBalance[msg.sender] >= msg.value, "Insufficient ETH balance");

        ethBalance[msg.sender] -= msg.value;
        uint weisPerPenny = IOracle(oracle).getWeiRate();
        IStableCoin(stableCoin).burn(msg.sender, amountEth / weisPerPenny);
        payable(msg.sender).transfer(amountEth);

    }

    function withdrawUsda(uint amountUsda) external payable whenNotPaused whenNotOutDated {
        require(IStableCoin(stableCoin).balanceOf(msg.sender) >= amountUsda, "Insufficient USDA balance");
        IStableCoin(stableCoin).burn(msg.sender, amountUsda);
    
        uint weisPerPenny = IOracle(oracle).getWeiRate();
        uint amountEth = amountUsda * weisPerPenny;
        ethBalance[msg.sender] -= amountEth;

        payable(msg.sender).transfer(amountEth);

    }

    modifier whenNotOutDated() {
        require(
            lastUpdate >= (block.timestamp - updateTolerance),
            "Rebase contract is paused. Try again later or contact the admin"
        );
        _;
    }
}
