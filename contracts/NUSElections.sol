// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;


/** 
 * @title NUSElections
 */

 /** 
 * To-do:
 * 1. Use NUSToken once NUSToken contract is ready
 * 2. Events 
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
    address[] voterList;
    uint256[] private votingOptions;
    mapping(address => Voter) public voters;
    mapping(uint256 => uint256) public votingResults;
    bool electionStatus;
    uint256 totalVotes = 0;

    /** 
     * @dev Create a new election
     * @param options a list of options 
     */
    constructor(uint256[] memory options) {
        electionOwner = msg.sender;
        votingOptions = options;
        electionStatus = false;
    }

    // events 

    event testVoting(uint256 votes);
    // emit winner 
    event voteMajority(uint256 voteID);
    // emit draw 
    // emit endVote 

    // modifiers 
    modifier electionOngoing() {
        require(
            !electionStatus, 
            "Election has ended."
        );
        _;
    }

    modifier electionEnded() {
        require(
            electionStatus, 
            "Election not ended yet."
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

    function vote(uint256 votingChoice) electionOngoing validVotingChoice(votingChoice) public {
        // uint256 memory curr_voter_NUST = nusTokenInstance.checkCredit();
        uint256 curr_voter_NUST = 1;
        Voter memory curr_voter = Voter(curr_voter_NUST, true, votingChoice);
        if (voters[msg.sender].voted == false) { // voter has not voted before 
            voters[msg.sender] = curr_voter;
            voterList.push(msg.sender);
            totalVotes += curr_voter_NUST;
        } else { // voter has voted before, changing vote 
            voters[msg.sender] = curr_voter;
        }
    }

    function tallyVote() public electionOngoing {
        // count the votes 
        for (uint256 i=0; i<voterList.length; i++) {
            Voter memory curr_voter = voters[voterList[i]];
            votingResults[curr_voter.vote] += curr_voter.weight;
        electionStatus = true;
        }
    }

    function getVotingResult() public electionEnded returns(uint256[] memory) {
        uint256[] memory results = new uint256[](votingOptions.length);
        for (uint i = 0; i < votingOptions.length; i++) {
            results[i] = votingResults[i];
        }

        return results;
    }

    // getters and helpers 
    function getVotingChoice() public view returns(uint256) {
        return voters[msg.sender].vote;
    }

    function getTotalVotes() public view returns(uint256) {
        return totalVotes;
    }

}
