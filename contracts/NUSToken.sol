pragma solidity ^0.5.0;

import './ERC20.sol';

contract NUSToken {

    /**
    TO DO LIST:
    1. figure out how the approval system would work, not sure if there is a way to auto-approve token usage for any given amt
        - now you have to approve for a fixed amount. There should be a "limitless" approval for the amount of tokens used 
    2. need to implement mint function to create all the tokens initially. can create a minted bool to check if already minted
    3. need to get canBlacklistAddresses modifiers and list
    4. blacklist addresses etc need to be public
    */

    

    ERC20 erc20Contract;
    uint256 SUPPLY_TOKEN_LIMIT = (2**256) - 1; // supply of tokens
    uint256 SEMESTER_TOKEN_DISTRIBUTION_NUMBER = 10000; // no. of tokens to be given out every semester
    mapping(address => bool) whitelistAddresses; // extra addresses that can distribute tokens, does not include contract owner (aka NUS)
    mapping(address => bool) blacklistedAddresses; // addresses that are blacklisted and cannot see results or bid for modules

    mapping(address => bool) canBlacklistAddresses; // addresses that can blacklist other addresses
    mapping(address => bool) canFineAddresses; // addresses that can fine users/students (eg; NUS, library)
    address public owner; // contract owner should be NUS, since NUS deploys this contract
    bool internal tokensMinted;


    // EVENTS
    
    // addition and removal of addresses into whitelist
    event addedWhitelistAddresses(address addr);
    event removedWhitelistAddresses(address addr);   

    // addition and removal of addresses into blacklist
    event addedblacklistedAddresses(address addr);
    event removedblacklistedAddresses(address addr);   

    // addition and removal of addresses into list of addresses that can fine
    event addedCanFineAddresses(address addr);
    event removedCanFineAddresses(address addr);

    // tokens has been given to the user
    event gaveTokens(address to, uint256 amt);

    // tokens distributed at the start of the semester
    event semesterTokensDistributed(address addr);

    // tokens has been taken from the user 
    event tookTokens(address from, uint256 amt);

    // all tokens taken from the given addresses
    event tokensRetrieved(address addr);

    // user is fined
    event fined(address from, uint256 amt);

    // MODIFIERS

    /**
    // @dev checking if the msg sender is NUS itself
    */
    modifier isContractOwner() { 
        require(msg.sender == owner, "Not owner of contract");
        _;
    }

    /**
    // @dev checking if msg sender is in the whitelisted addresses list
    */
    modifier isWhitelistAddress() {
        require(whitelistAddresses[msg.sender], "Not a whitelisted address");
        _;
    }

    /** 
    // @dev checking if msg sender is eligible to fine users/students, ie; in canFineAddresses
    */
    modifier isFineAddress() {
        require(whitelistAddresses[msg.sender], "Not an address that is allowed to fine");
        _;
    }

    // CONSTRUCTOR

    /** 
    * @dev create new NUSToken instance, with addresses for whitelist, blacklist, addresses that can fine.

    */
    constructor() public {
        ERC20 e = new ERC20();
        e.mint(address(this), SUPPLY_TOKEN_LIMIT);
        erc20Contract = e;
        owner = msg.sender;
        whitelistAddresses[owner] = true;
        canFineAddresses[owner] = true;

    }

    // FUNCTIONS/LOGIC

    /** 
    * @dev get the number of tokens for the specified user
    * @param user address of user to check number of tokens
    */
    function balanceOf(address user) public view returns(uint256) {
        uint256 credit = erc20Contract.balanceOf(user);
        return credit;
    }

    /** 
    * @dev add additional addresses to whitelist to allow them to distrubute tokens
    * @param addresses a list of addressses to add into whitelist
    */
    function addWhitelistAddresses(address addr) public isContractOwner {
        whitelistAddresses[addr] = true;
        emit addedWhitelistAddresses(addr);
    }

    /** 
    * @dev remove addresses from the whitelist
    * @param addresses a list of addressses to remove from whitelist
    */
    function removeWhitelistAddresses(address addr) public isContractOwner {
        whitelistAddresses[addr] = true;
        emit removedWhitelistAddresses(addr);
    }

    /** 
    * @dev add additional addresses to the blacklist
    * @param addresses a list of addressses to add into whitelist
    */
    function addblacklistedAddresses(address addr) public isContractOwner {
        blacklistedAddresses[addr] = true;
        emit addedblacklistedAddresses(addr);
    }

    /** 
    * @dev remove addresses from the blacklist
    * @param addresses a list of addressses to remove from blacklist
    */
    function removeblacklistedAddresses(address addr) public isContractOwner {
        blacklistedAddresses[addr] = true;
        emit removedblacklistedAddresses(addr);
    }

    /** 
    * @dev add additional addresses to the list of addresses that can fine users
    * @param addresses a list of addressses to add into list of addresses that can fine users
    */
    function addCanFineAddresses(address addr) public isContractOwner {
        canFineAddresses[addr] = true;
        emit addedCanFineAddresses(addr);
    }

    /** 
    * @dev remove addresses to the list of addresses that can fine users
    * @param addresses a list of addressses to remove from list of addresses that can fine users
    */
    function removeCanFineAddresses(address addr) public isContractOwner {

        canFineAddresses[addr] = false;
        emit removedCanFineAddresses(addr);
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
    function semesterTokenDistribution(address addr) public isContractOwner {

        giveTokens(addresses, SEMESTER_TOKEN_DISTRIBUTION_NUMBER);
        emit semesterTokensDistributed(addr);
    }

    /** 
    * @dev large scale retrieval of all tokens of all 
    *      addresses in the list of given addresses, 
    *      used for graduation of students or other similar events.
    *      only NUS should be able to do this.
    * @param addresses addresses of all users whose tokens need to be retrieved.
    */
    function retrieveAllTokens(address addr) public isContractOwner {
        takeTokens(addresses, this.balanceOf(addr));
        emit tokensRetrieved(addr);
    }



    function giveApproval(address receipt, uint256 amt) public {
        erc20Contract.approve(receipt, amt);
    }

    // GETTERS

    function getTotalSupply() public view returns (uint256) {
        return SUPPLY_TOKEN_LIMIT;
    }

    function getSemesterTokenDistributionNumber() public view returns (uint256) {
        return SEMESTER_TOKEN_DISTRIBUTION_NUMBER;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function isAddressInWhitelistAddresses(address addr) view public returns (bool) {
        return whitelistAddresses[addr];
    }

    function isAddressInBlacklistedAddresses(address addr) view public returns (bool) {
        return blacklistedAddresses[addr];
    }

    function isAddressInCanFineAddresses(address addr) view public returns (bool) {
        return canFineAddresses[addr];
    }
}
