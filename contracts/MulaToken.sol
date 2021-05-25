pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MulaToken is ERC20, Ownable {
    
    /** If false we are are in transfer lock up period.*/
    bool public released = false;

    /**Only the crowdsale address can make transfer during the lock up period */
    address public crowdsale;

    /** Limit token transfer until the lockup period is over.*/
    modifier canTransfer() {
        if(!released) {
            require(crowdsale == msg.sender,"you are not permitted to make transactions");
        }
        _;
    }
    constructor() ERC20("Mula Token", "MULA") {
        _mint(msg.sender, 100000000);
    }
    /** Allow only the crowdsale address to relase the tokens into the wild */
    function releaseTokenTransfer() public {
        require (msg.sender == crowdsale);
            released = true;       
    }
    //Set the crowdsale address. 
    function setReleaser(address _crowdsale) onlyOwner public {
        crowdsale = _crowdsale;
    }
    function transfer(address _to, uint256 _value) canTransfer() public override returns (bool success) {
        super.transfer(_to,_value);
        return true;
    }

}