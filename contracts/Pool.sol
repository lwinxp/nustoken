pragma solidity >= 0.5.0;

import './ERC20.sol';

contract Pool {
    ERC20 erc20instance;
    address chairperson;

    uint256 totalPool; //total amount of PTs in the pool
    address[] voterList; //List of addresses that sent PT to the pool
    mapping(address => uint256) tokenWeights; // How much weight does each voter have
    mapping(address => address) votingChoice; // Who has each voter voted for?
    mapping(address => uint256) candidateVotes; // How much weight has each address got (used to decide winner)?
    address winner;

    constructor() public {
        erc20instance = new ERC20();
        chairperson = msg.sender;

        totalPool = 0;
    }

    event Transfer(address to, uint256 amount); //event of transfer money from Pool contract to an address
    event GetPT(address to, uint256 amount); //event of an address gets PT with Eth
    event TokenSent(address sender, uint256 amt); //event of an address sends PT to Pool and gets votes
    event Voted(address candidate); //event of voting for a candidate
    event VoteWon(address winner, uint256 poolWon); //event of winning the voting
    event VoteDrawn(); //event of no one wins the voting

    function getPT() public payable returns(uint256) { //an address gets PT with Eth
        require(msg.value >= 1E16, "At least 0.01ETH needed to get PT");
        uint256 val = msg.value/ 1E16;
        erc20instance.mint(msg.sender, val);
        emit GetPT(msg.sender, val);
    }

// no changes needed before this point

    function transferPT(address to, uint256 amount) private { //transfer PT from Pool contract to an address, will be called within the contract when voting ends to transfer the PT in the pool to the winner or return the PT
       
        emit Transfer();
    }

    function sendTokens(uint256 amt) public { //send PT to the pool, grants sender voting weights
      
        emit TokenSent();
    }


    function vote(address candidate) public { //vote for a candidate
        // Return an error saying "Can't vote twice!" if a voter tries to vote twice
        emit Voted();
    }


    function endVoting() public returns(uint256) {
        //Return an error saying "Only chairperson can end voting" if non-chair tries to end voting

        // If % exceeds 50% then transfer all PTs to winner
        if(maxvotes > totalPool/2) {
            emit VoteWon();
          
            
        } else {
            // Vote draw, emit VoteDrawn, return PTs
            emit VoteDrawn();
            
        }

// no changes needed after this point

        // Reset all mappings --> allows multiple voting cycles
        for(uint k=0; k<voterList.length; k++) {
            address add = voterList[k];
            delete tokenWeights[add];
            delete votingChoice[add];
            delete candidateVotes[add];
        }
        

        return maxvotes;

    }

//getter functions for testing
    function getTotalPool() public view returns(uint256) {
        return totalPool;
    }

    function getTokenBalance(address user) public view returns(uint256) {
        return erc20instance.balanceOf(user);
    }

    function getVote(address voter) public view returns(address) {
        return votingChoice[voter];
    }

    function getVoterListLength() public view returns (uint256) {
        return voterList.length;
    }

    function getcandidateVotes(address candidate) public view returns (uint256) {
        return candidateVotes[candidate];
    }

    function gettokenWeights(address voter) public view returns(uint256) {
        return tokenWeights[voter];
    }


}