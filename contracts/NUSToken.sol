pragma solidity ^0.5.0;

import './ERC20.sol';

contract NUSToken {

    /**
    TO DO LIST:
    1. check if value is already 0 for fine() then decide what to do with this
    */

    ERC20 erc20Contract;
    uint256 SUPPLY_TOKEN_LIMIT = (2**256) - 1; // supply of tokens
    uint256 SEMESTER_TOKEN_DISTRIBUTION_NUMBER = 10000; // no. of tokens to be given out every semester
    mapping(address => bool) whitelistAddresses; // extra addresses that can distribute tokens, does not include contract owner (aka NUS)
    mapping(address => bool) blacklistedAddresses; // addresses that are blacklisted and cannot see results or bid for modules
    mapping(address => bool) canBlacklistAddresses; // addresses that can blacklist other addresses
    mapping(address => bool) canFineAddresses; // addresses that can fine users/students (eg; NUS, library)
    mapping(uint256 => string) typeOfAdd; // mapping of uint256 to string (name) (0: whitelist, 1: blacklist, 2:can blacklist, 3: can fine)
    address public owner; // contract owner should be NUS, since NUS deploys this contract


    // EVENTS
    
    // addition or removal of an address
    // bool addOrRemove: addition: true, removal: false
    event modifiedAddressList(address addr, string typeOfAddress, bool addOrRemove);

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
    // @dev checking if msg sender is eligible to blacklist users/students
    */
    modifier isCanBlacklistAddress() {
        require(canBlacklistAddresses[msg.sender], "Not eligible to blacklist addressess");
        _;
    }

    /** 
    // @dev checking if msg sender is eligible to fine users/students, ie; in canFineAddresses
    */
    modifier isCanFineAddresses() {
        require(canFineAddresses[msg.sender], "Not an address that is allowed to fine");
        _;
    }

    // CONSTRUCTOR

    /** 
    * @dev create new NUSToken instance, with addresses for whitelist, blacklist, addresses that can fine.
    */
    constructor() public {
        ERC20 e = new ERC20();
        erc20Contract = e;
        erc20Contract.mint(address(this), SUPPLY_TOKEN_LIMIT); // mints all tokens at once
        owner = msg.sender;
        whitelistAddresses[owner] = true;
        canBlacklistAddresses[owner] = true;
        canFineAddresses[owner] = true;
        typeOfAdd[0] = "whitelistAddresses";
        typeOfAdd[1] = "blacklistedAddresses";
        typeOfAdd[2] = "canBlacklistAddresses";
        typeOfAdd[3] = "canFineAddresses";

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
    * @dev modify list (add or remove) with a given address
    *      if remove then sets the address to false in mapping, 
    *      if add then sets the address to true in mapping.
    * @param addr a list of addresses to add into whitelist
    * @param typeOfList type of list to modify (0: whitelist, 1: blacklist, 2:can blacklist, 3: can fine)
    * @param addOrRemove to decide to add or remove from the list. true for add, false for remove.
    */
    function modifyList(address addr, uint256 typeOfList , bool addOrRemove) public isContractOwner {
        // require(typeOfAdd[typeOfList] != "0" , "Not a valid list type");
        if (typeOfList == 0){
            whitelistAddresses[addr] = addOrRemove;
        } else if (typeOfList == 1){
            blacklistedAddresses[addr] = addOrRemove;
        } else if (typeOfList == 2){
            canBlacklistAddresses[addr] = addOrRemove;
        } else if (typeOfList == 3){
            canFineAddresses[addr] = addOrRemove;
        } else {
            revert("Incorrect typeOfList");
        }
        emit modifiedAddressList(addr, typeOfAdd[typeOfList], addOrRemove);
    }

    /** 
    * @dev add/remove an address to/from the blacklist,
    *      only addresses in the CanBlacklistAddresses 
    *      list can do this. 
    * @param addr a list of addresses to add into whitelist
    * @param addOrRemove to add set as true, to remove set as false
    */
    function modifyBlacklist(address addr, bool addOrRemove) public isCanBlacklistAddress {
        blacklistedAddresses[addr] = addOrRemove;
        emit modifiedAddressList(addr, typeOfAdd[1], addOrRemove);
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
    function fine(address from, uint256 amt) public isCanFineAddresses {
        erc20Contract.transferFrom(from, address(this), amt);
        emit fined(from, amt);
    }

    /** 
    * @dev distributes tokens, this happens every semester
    *      only NUS should be able to do this.
    * @param addr address of an NUS students in school this semester
    */
    function semesterTokenDistribution(address addr) public isContractOwner {
        giveTokens(addr, SEMESTER_TOKEN_DISTRIBUTION_NUMBER);
        emit semesterTokensDistributed(addr);
    }

    /** 
    * @dev retrieval of all tokens of an address
    *      used for graduation of students or other similar events.
    *      only NUS should be able to do this.
    * @param addr address of user whose tokens need to be retrieved.
    */
    function retrieveAllTokens(address addr) public isContractOwner {
        takeTokens(addr, this.balanceOf(addr));
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

    function isAddressInCanBlacklistAddresses(address addr) view public returns (bool) {
        return canBlacklistAddresses[addr];
    }

    function isAddressInCanFineAddresses(address addr) view public returns (bool) {
        return canFineAddresses[addr];
    }
}