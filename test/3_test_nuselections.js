const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');


var NUSToken = artifacts.require("../contracts/NUSToken.sol");
var NUSElections = artifacts.require("../contracts/NUSElections.sol");

contract('NUSElections', function(accounts) {
  before(async () => {
    NUSTokenInstance = await NUSToken.deployed();
    NUSElectionsInstance = await NUSElections.deployed();
    NUSElectionsInstanceDraw = await NUSElections.new([0,1], 2, 1, NUSTokenInstance.address);
    // new elections instance to test draw result case
  });

  console.log("Testing NUS Elections");

  it('Give Tokens to students', async() =>{
      await NUSTokenInstance.giveTokens(accounts[1],100);
      await NUSTokenInstance.giveTokens(accounts[2],200);

      account1Balance = await NUSTokenInstance.balanceOf(accounts[1]);
      account2Balance = await NUSTokenInstance.balanceOf(accounts[2]);

      assert.strictEqual(
          account1Balance.toNumber(),
          100,
          "Failed to give Tokens"
      )

      assert.strictEqual(
          account2Balance.toNumber(),
          200,
          "Failed to give Tokens"
      )
  })

  it('Student 1 can vote for election option 0', async() => {
      await NUSElectionsInstance.vote(0, {from: accounts[1]});
      
      hasVoted1 = await NUSElectionsInstance.hasVoted(accounts[1])
      getVotingChoice1 = await NUSElectionsInstance.getVotingChoice({from: accounts[1]})
      getCurrentNumVoters1 = await NUSElectionsInstance.getCurrentNumVoters({from: accounts[1]})
      getMinimumNumVoters1 = await NUSElectionsInstance.getMinimumNumVoters({from: accounts[1]})
      showVotingReward1 = await NUSElectionsInstance.showVotingReward({from: accounts[1]})

      assert.strictEqual(hasVoted1, true);
      assert.strictEqual(getVotingChoice1.toNumber(), 0);
      assert.strictEqual(getCurrentNumVoters1.toNumber(), 1);
      assert.strictEqual(getMinimumNumVoters1.toNumber(), 2);
      assert.strictEqual(showVotingReward1.toNumber(), 1);
  });

  it('tallyVote cannot be called if minimum votes are not reached', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.tallyVote({from: accounts[0]}), "Election has not met minimum required number of voters.")
  });

  it('Student 2 can vote for election option 1', async() => {
    hasVoted2 = await NUSElectionsInstance.hasVoted(accounts[2])
    await NUSElectionsInstance.vote(1, {from: accounts[2]});
    
    getVotingChoice2 = await NUSElectionsInstance.getVotingChoice({from: accounts[2]})
    getCurrentNumVoters2 = await NUSElectionsInstance.getCurrentNumVoters({from: accounts[2]})
    getMinimumNumVoters2 = await NUSElectionsInstance.getMinimumNumVoters({from: accounts[2]})
    showVotingReward2 = await NUSElectionsInstance.showVotingReward({from: accounts[2]})

    assert.strictEqual(hasVoted2, false);
    assert.strictEqual(getVotingChoice2.toNumber(), 1);
    assert.strictEqual(getCurrentNumVoters2.toNumber(), 2);
    assert.strictEqual(getMinimumNumVoters2.toNumber(), 2);
    assert.strictEqual(showVotingReward2.toNumber(), 1);
  });

  it('tallyVote cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.tallyVote({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('getVotingResult cannot be called if election has not ended', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.getVotingResult({from: accounts[1]}), "Election not ended yet.")
  });

  it('tallyVote can be called by account that is the election owner', async() => {
    await NUSElectionsInstance.tallyVote({from: accounts[0]})

    getElectionStatus1 = await NUSElectionsInstance.getElectionStatus({from: accounts[1]})
    assert.strictEqual(getElectionStatus1, true);
  });

  it('getVotingResult cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.getVotingResult({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('getVotingResult can be called by account that is the election owner, to emit winning event', async() => {
    getVotingResult0 = await NUSElectionsInstance.getVotingResult({from: accounts[0]})

    truffleAssert.eventEmitted(getVotingResult0, "winningVote");
  });

  // it('getTotalVotes can be called to get correct total votes', async() => {
  //   getTotalVotes0 = await NUSElectionsInstance.getTotalVotes({from: accounts[0]})

  //   assert.strictEqual(getTotalVotes0.toNumber(), 300);
  // });

  it('showVotingResult can be called to get correct votes per option', async() => {
    showVotingResult1 = await NUSElectionsInstance.showVotingResult({from: accounts[1]})

    assert.strictEqual(showVotingResult1.toString(), '100,200');
  });

  it('issueVotingReward cannot be called if token balance does not equal or exceed voting reward', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.issueVotingReward({from: accounts[0]}), "NUS Token balance must equal or exceed voting reward.")
  });

  it('issueVotingReward cannot be called by account that is not election owner, even if token balance equals or exceeds voting reward', async() => {
    await NUSTokenInstance.giveTokens(NUSElectionsInstance.address,10);
    accountElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstance.address);
    showElectionsBalance = await NUSElectionsInstance.showElectionBalance({from: accounts[0]});

    assert.strictEqual(
      accountElectionsBalance.toNumber(),
      10,
      "Failed to give Tokens"
    )

    assert.strictEqual(showElectionsBalance.toNumber(),10)

    await truffleAssert.reverts(NUSElectionsInstance.issueVotingReward({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('issueVotingReward can be called by account that is election owner and token balance equals or exceeds voting reward', async() => {
    showRewardStatusBefore = await NUSElectionsInstance.getRewardStatus({from: accounts[1]});

    await NUSTokenInstance.modifyList(NUSElectionsInstance.address, 0, true, {from: accounts[0]});
    // whitelist election address

    isAddressInWhitelistAddresses0 = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[0], {from: accounts[0]})
    isElectionAddressInWhitelistAddresses = await NUSTokenInstance.isAddressInWhitelistAddresses(NUSElectionsInstance.address, {from: accounts[0]})

    assert.strictEqual(isAddressInWhitelistAddresses0, true);
    assert.strictEqual(isElectionAddressInWhitelistAddresses, true);
    assert.strictEqual(showRewardStatusBefore, false);

    await NUSElectionsInstance.issueVotingReward({from: accounts[0]})
    balance1 = await NUSTokenInstance.balanceOf(accounts[1]);
    balance2 = await NUSTokenInstance.balanceOf(accounts[2]);
    balanceElections = await NUSTokenInstance.balanceOf(NUSElectionsInstance.address);
    showElectionsBalance = await NUSElectionsInstance.showElectionBalance({from: accounts[0]});
    showRewardedVoter1 = await NUSElectionsInstance.showRewardedVoter(accounts[1]);
    showRewardedVoter2 = await NUSElectionsInstance.showRewardedVoter(accounts[2]);
    showRewardStatusAfter = await NUSElectionsInstance.getRewardStatus({from: accounts[1]});

    assert.strictEqual(balance1.toNumber(), 101);
    assert.strictEqual(balance2.toNumber(), 201);
    assert.strictEqual(balanceElections.toNumber(), 8);
    assert.strictEqual(showElectionsBalance.toNumber(),8)
    assert.strictEqual(showRewardedVoter1, true);
    assert.strictEqual(showRewardedVoter2, true);
    assert.strictEqual(showRewardStatusAfter, true);
  });

  it('issueVotingReward can only be called once, not repeatedly', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.issueVotingReward({from: accounts[0]}), "Voting reward has been issued..")
  });

  it('returnTokenToAdmin cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.returnTokenToAdmin({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('returnTokenToAdmin can be called by account that is the election owner', async() => {
    await NUSElectionsInstance.returnTokenToAdmin({from: accounts[0]})

    nusElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstance.address);
    showElectionsBalance = await NUSElectionsInstance.showElectionBalance({from: accounts[0]});

    assert.strictEqual(nusElectionsBalance.toNumber(), 0);
    assert.strictEqual(showElectionsBalance.toNumber(), 0);
  });

  it('NUSElections can have draw result', async() => {
    await NUSTokenInstance.giveTokens(accounts[3],200);
    await NUSTokenInstance.giveTokens(accounts[4],200);
    await NUSTokenInstance.giveTokens(NUSElectionsInstanceDraw.address,1);

    account3Balance = await NUSTokenInstance.balanceOf(accounts[3]);
    account4Balance = await NUSTokenInstance.balanceOf(accounts[4]);
    accountElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstanceDraw.address);
    showElectionsBalance = await NUSElectionsInstanceDraw.showElectionBalance({from: accounts[0]});

    assert.strictEqual(
        account3Balance.toNumber(),
        200,
        "Failed to give Tokens"
    )

    assert.strictEqual(
        account4Balance.toNumber(),
        200,
        "Failed to give Tokens"
    )

    assert.strictEqual(
      accountElectionsBalance.toNumber(),
      1,
      "Failed to give Tokens"
    )
    
    assert.strictEqual(showElectionsBalance.toNumber(),1)

    await NUSElectionsInstanceDraw.vote(0, {from: accounts[3]});
    
    getVotingChoice3 = await NUSElectionsInstanceDraw.getVotingChoice({from: accounts[3]})
    assert.strictEqual(getVotingChoice3.toNumber(), 0);

    await NUSElectionsInstanceDraw.vote(1, {from: accounts[4]});
    
    getVotingChoice4 = await NUSElectionsInstanceDraw.getVotingChoice({from: accounts[4]})
    assert.strictEqual(getVotingChoice4.toNumber(), 1);

    await truffleAssert.reverts(NUSElectionsInstanceDraw.issueVotingReward({from: accounts[0]}), "Election not ended yet..")

    await NUSElectionsInstanceDraw.tallyVote({from: accounts[0]})

    getElectionStatus3 = await NUSElectionsInstanceDraw.getElectionStatus({from: accounts[3]})
    assert.strictEqual(getElectionStatus3, true);

    getVotingResult0 = await NUSElectionsInstanceDraw.getVotingResult({from: accounts[0]})

    truffleAssert.eventEmitted(getVotingResult0, "draw");

    showVotingResult3 = await NUSElectionsInstanceDraw.showVotingResult({from: accounts[3]})

    assert.strictEqual(showVotingResult3.toString(), '200,200');

  });

  it('Voting reward can be distributed in 1st-come-1st-serve order when token balance is insufficient for all voters', async() => {

    await NUSTokenInstance.modifyList(NUSElectionsInstanceDraw.address, 0, true, {from: accounts[0]});

    isAddressInWhitelistAddresses0 = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[0], {from: accounts[0]})
    isElectionDrawAddressInWhitelistAddresses = await NUSTokenInstance.isAddressInWhitelistAddresses(NUSElectionsInstanceDraw.address, {from: accounts[0]})

    assert.strictEqual(isAddressInWhitelistAddresses0, true);
    assert.strictEqual(isElectionDrawAddressInWhitelistAddresses, true);

    await NUSElectionsInstanceDraw.issueVotingReward({from: accounts[0]})
    balance3 = await NUSTokenInstance.balanceOf(accounts[3]);
    balance4 = await NUSTokenInstance.balanceOf(accounts[4]);
    balanceElections = await NUSTokenInstance.balanceOf(NUSElectionsInstanceDraw.address);
    showElectionsBalance = await NUSElectionsInstanceDraw.showElectionBalance({from: accounts[0]});
    showRewardedVoter3 = await NUSElectionsInstanceDraw.showRewardedVoter(accounts[3]);
    showRewardedVoter4 = await NUSElectionsInstanceDraw.showRewardedVoter(accounts[4]);

    assert.strictEqual(balance3.toNumber(), 201);
    assert.strictEqual(balance4.toNumber(), 200);
    assert.strictEqual(balanceElections.toNumber(), 0);
    assert.strictEqual(showElectionsBalance.toNumber(),0)
    assert.strictEqual(showRewardedVoter3, true);
    assert.strictEqual(showRewardedVoter4, false);

    await truffleAssert.reverts(NUSElectionsInstanceDraw.returnTokenToAdmin({from: accounts[0]}), "NUS Token balance must be more than 0..")
  });
});
