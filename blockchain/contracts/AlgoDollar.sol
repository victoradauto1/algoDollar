// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./IStableCoin.sol";

contract AlgoDollar is ERC20,ERC20Burnable, Ownable, IStableCoin{


    address public rebase;


    constructor() ERC20("AlgoDollar", "USDA") Ownable(msg.sender){

    }

    function setRebase(address newRebase) external onlyOwner{
        rebase = newRebase;
    }

    function mint(address to, uint amount) external onlyAdmins{
        _mint(to, amount);
     }

    function burn(address from, uint amount) external onlyAdmins{
        _burn(from, amount);
    }

    
    function decimals() public view virtual override returns(uint8){
        return 2;
    }

    modifier  onlyAdmins {
        require(msg.sender == rebase || msg.sender == owner(), "Only rebase contract or owner can make this call");
        _;
    }
}