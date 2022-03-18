pragma solidity ^0.5.0;

import './ERC20.sol';

contract NUSToken {

    /**
    TO DO LIST:
    1. 
    */

    

    ERC20 erc20Contract;
    uint256 SUPPLY_TOKEN_LIMIT = (2**256) - 1; // supply of tokens
    uint256 SEMESTER_TOKEN_DISTRIBUTION_NUMBER = 10000; // no. of tokens to be given out every semester
    mapping(address => bool) whitelistAddresses; // extra addresses that can distribute tokens, does not include contract owner (aka NUS)
    mapping(address => bool) blacklistAddresses; // addresses that are blacklisted and cannot see results or bid for modules
    mapping(address => bool) fineAddresses; // addresses that can fine users/students (eg; NUS, library)
    address public owner = msg.sender; // contract owner is NUS, NUS deploys this contract


    // EVENTS
    
    // addition and removal of addresses into whitelist
    event addedWhitelistAddresses(address[] addresses);
    event removedWhitelistAddresses(address[] addresses);   

    // addition and removal of addresses into blacklist
    event addedBlacklistAddresses(address[] addresses);
    event removedBlacklistAddresses(address[] addresses);   

    // addition and removal of addresses into list of addresses that can fine
    event addedFineAddresses(address[] addresses);
    event removedFineAddresses(address[] addresses);

    // tokens has been given to the user
    event gaveTokens(address to, uint256 amt);

    // tokens distributed at the start of the semester
    event semesterTokensDistributed(address[] addresses);

    // tokens has been taken from the user 
    event tookTokens(address from, uint256 amt);

    // all tokens taken from the given addresses
    event tokensRetrieved(address[] addresses);

    // user is fined
    event fined(address from, uint256 amt);

    // MODIFIERS

    /**
    // @dev checking if the msg sender is NUS itself
    */
    modifier isContractOwner() { 
        require(msg.sender == owner, "Not owner of contract");
    }

    /**
    // @dev checking if msg sender is in the whitelisted addresses list
    */
    modifier isWhitelistAddress() {
        require(whitelistAddresses[msg.sender], "Not a whitelisted address");
    }

    /** 
    // @dev checking if msg sender is eligible to fine users/students, ie; in fineAddresses
    */
    modifier isFineAddress() {
        require(whitelistAddresses[msg.sender], "Not an address that is allowed to fine");
    }

    // CONSTRUCTORS

    /** 
    * @dev create new NUSToken instance, with no addresses
    */
    constructor() public {
        ERC20 e = new ERC20();
        erc20Contract = e;
        owner = msg.sender;
        whitelistAddresses[owner] = true;
        fineAddresses[owner] = true;
    }

    /** 
    * @dev create new NUSToken instance, with addresses for whitelist, blacklist, addresses that can fine.
    * @param whitelistAddresses a list of addresses in the whitelist
    * @param blacklistAddresses a list of addresses in the blacklist
    * @param fineAddresses a list of addresses in the list of addresses that can fine
    */
    constructor(address[] memory whitelistAddresses, address[] memory blacklistAddresses, address[] memory fineAddresses) public {
        ERC20 e = new ERC20();
        erc20Contract = e;
        owner = msg.sender;

        whitelistAddresses[owner] = true;
        for (uint256 i=0; i < whitelistAddresses.length; i++) {
            whitelistAddresses[whitelistAddresses[i]] = true;
        }

        for (uint256 i=0; i < blacklistAddresses.length; i++) {
            blacklistAddresses[blacklistAddresses[i]] = true;
        }

        fineAddresses[owner] = true;
        for (uint256 i=0; i < fineAddresses.length; i++) {
            fineAddresses[fineAddresses[i]] = true;
        }

    }

    // FUNCTIONS/LOGIC

    /** 
    * @dev get the number of tokens for the specified user
    * @param user address of user to check number of tokens
    */
    function balanceOf(address user) public returns(uint256) {
        uint256 credit = erc20Contract.balanceOf(user);
        return credit;
    }

    /** 
    * @dev add additional addresses to whitelist to allow them to distrubute tokens
    * @param addresses a list of addressses to add into whitelist
    */
    function addWhitelistAddresses(address[] memory addresses) public isContractOwner {
        for (uint256 i=0; i < addresses.length; i++) {
            whitelistAddresses[addresses[i]] = true;
        }
        emit addedWhitelistAddresses(addresses);
    }

    /** 
    * @dev remove addresses from the whitelist
    * @param addresses a list of addressses to remove from whitelist
    */
    function removeWhitelistAddresses(address[] memory addresses) public isContractOwner {
        for (uint256 i=0; i < addresses.length; i++) {
            whitelistAddresses[addresses[i]] = false;
        }
        emit removedWhitelistAddresses(addresses);
    }

    /** 
    * @dev add additional addresses to the blacklist
    * @param addresses a list of addressses to add into whitelist
    */
    function addBlacklistAddresses(address[] memory addresses) public isContractOwner {
        for (uint256 i=0; i < addresses.length; i++) {
            blacklistAddresses[addresses[i]] = true;
        }
        emit addedBlacklistAddresses(addresses);
    }

    /** 
    * @dev remove addresses from the blacklist
    * @param addresses a list of addressses to remove from blacklist
    */
    function removeBlacklistAddresses(address[] memory addresses) public isContractOwner {
        for (uint256 i=0; i < addresses.length; i++) {
            blacklistAddresses[addresses[i]] = false;
        }
        emit removedBlacklistAddresses(addresses);
    }

    /** 
    * @dev add additional addresses to the list of addresses that can fine users
    * @param addresses a list of addressses to add into list of addresses that can fine users
    */
    function addFineAddresses(address[] memory addresses) public isContractOwner {
        for (uint256 i=0; i < addresses.length; i++) {
            fineAddresses[addresses[i]] = true;
        }
        emit addedFineAddresses(addresses);
    }

    /** 
    * @dev remove addresses to the list of addresses that can fine users
    * @param addresses a list of addressses to remove from list of addresses that can fine users
    */
    function removeFineAddresses(address[] memory addresses) public isContractOwner {
        for (uint256 i=0; i < addresses.length; i++) {
            fineAddresses[addresses[i]] = false;
        }
        emit removedFineAddresses(addresses);
    }


    /** 
    * @dev transfer tokens from supply pool to receiver 
    *      any whitelisted address can use this since we 
    *      we want NUS entities (eg; survey researchers) 
    *      to be able to reward the students for participation.
    * @param receiver address of the receiving party
    * @param amt amount of tokens that the receiver receives
    */
    function giveTokens(address receiver, uint256 amt) public isWhitelistAddress {
        erc20Contract.transfer(receiver, amt);
        emit gaveTokens(receiver, amt);
    }
    
    /** 
    * @dev take tokens from a user,
    *      transferred to this contract, 
    *      only NUS should be able to do this.
    * @param from address of the user whose token is being taken
    * @param amt amount of tokens that is taken
    */
    function takeTokens(address from, uint256 amt) public isContractOwner {
        erc20Contract.transferFrom(from, address(this), amt);
        emit tookTokens(from, amt);
    }

    /** 
    * @dev fine a user in tokens,
    *      transferred to this contract, 
    *      only addresses that can fine should be able to do this.
    * @param from address of the user whose token is being fined
    * @param amt amount of tokens that is fined
    */
    function fine(address from, uint256 amt) public isFineAddress {
        erc20Contract.transferFrom(from, address(this), amt);
        emit fined(from, amt);
    }

    /** 
    * @dev distributes tokens, this happens every semester
    *      only NUS should be able to do this.
    * @param addresses addresses of all NUS students in school this semester
    */
    function semesterTokenDistribution(addresses[] memory addresses) public isContractOwner {
        for (uint256 i=0; i<addresses.length; i++) {
            giveTokens(addresses[i], SEMESTER_TOKEN_DISTRIBUTION_NUMBER);
        }
        emit semesterTokensDistributed(addresses);
    }

    /** 
    * @dev large scale retrieval of all tokens of all 
    *      addresses in the list of given addresses, 
    *      used for graduation of students or other similar events.
    *      only NUS should be able to do this.
    * @param addresses addresses of all users whose tokens need to be retrieved.
    */
    function retrieveAllTokens(addresses[] memory addresses) public isContractOwner {
        for (uint256 i=0; i<addresses.length; i++) {
            takeTokens(addresses[i], this.balanceOf(addresses[i]));
        }
        emit tokensRetrieved(addresses);
    }



    function giveApproval(address receipt, uint256 amt) public {
        erc20Contract.approve(receipt, amt);
    }



}