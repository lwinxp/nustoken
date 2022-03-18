pragma solidity ^0.5.0;

import './ERC20.sol';

contract NUSToken {

    mapping(address => bool) whitelistAddresses; // extra addresses that can distribute tokens, does not include contract owner (aka NUS)
    address public owner = msg.sender; // contract owner is NUS, NUS deploys this contract
    
    event addedAddresses(address[] addresses);

    // checking if the msg sender is NUS itself
    modifier isContractOwner() { 
        require(msg.sender == owner, "Not owner of contract");
    }

    // checking if msg sender is in the whitelisted addresses list
    modifier isWhitelistAddress() {
        require(whitelistAddresses[msg.sender], "Not a whitelisted address");
    }

    // if no additional whitelist addresses
    constructor() public {
        whitelistAddresses[owner] = true;
    }

    // if there are additional whitelist addresses
    constructor(memory address[] addresses) public {
        whitelistAddresses[owner] = true;
        for (uint256 i=0; i < addresses.length; i++) {
            whitelistAddresses[addresses[i]] = true;
        }
    }


    // adding additional addresses to allow for token distribution
    function addWhitelistAddresses(address[] memory addresses) private isContractOwner returns (bool) {
        for (uint256 i=0; i < addresses.length; i++) {
            whitelistAddresses[addresses[i]] = true;
        }
        emit addedAddresses(addresses);
    }


    * @dev transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    // has to be the contract owner (aka NUS)
    function transfer(address _to, uint256 _value) public isContractOwner returns (bool) {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }



    /**
    * @dev Transfer tokens from one address to another
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value uint256 the amount of tokens to be transferred
    */
    function transferFrom(address _from, address _to, uint256 _value) public isContractOwner returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from], "Balance From Low");
        // require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        // allowed[_from][tx.origin] = allowed[_from][tx.origin].sub(_value);
        emit Transfer(_from, _to, _value);
    return true;
    }


}