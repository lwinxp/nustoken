// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;


/** 
 * @title NUSElections
 */

 /** 
 * To-do:
 * 1. Use NUSToken once NUSToken contract is ready
 */

contract NUSElections {

    struct Voter {
        uint256 weight; // weight is accumulated by delegation, default is 0
        bool voted;  // if true, that person already voted, default is false 
        // address delegate; // person delegated to
        uint256 vote;   // index of the voted proposal, default is 0
    }

    // NUSToken nusTokenInstance
    address public electionOwner;
    mapping(address => Voter) public voters;
    uint256[] private votingOptions;
    bool electionEnded;

    /** 
     * @dev Create a new election
     * @param options a list of options 
     */
    constructor(uint256[] memory options) {
        electionOwner = msg.sender;
        votingOptions = options;
        electionEnded = false;
    }

    // modifiers 
    modifier onGoingElection() {
        require(
            !electionEnded, 
            "Election has ended."
        );
        _;
    }

    // when doing frontend, map the options of the voting to a index, starting from 0
    modifier validVotingChoice(uint256 votingChoice) {
        require(
            votingChoice >= 0 && votingChoice <= votingOptions.length, 
            "Invalid voting option"
        );
        _;
    }

    // main functions 

    function vote(uint256 votingChoice) onGoingElection validVotingChoice(votingChoice) public {
        // uint256 memory curr_voter_NUST = nusTokenInstance.checkCredit();
        uint256 curr_voter_NUST = 1;
        Voter memory curr_voter = Voter(curr_voter_NUST, true, votingChoice);
        
        voters[msg.sender] = curr_voter;
        
    }

    function tallyVote() public {
        // count the votes 
        electionEnded = true;
    }

    // getters 
    function getVotingChoice() public view returns(uint256) {
        return voters[msg.sender].vote;
    }

}
