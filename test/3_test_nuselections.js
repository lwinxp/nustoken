const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');


var NUSToken = artifacts.require("../contracts/NUSToken.sol");
var NUSElections = artifacts.require("../contracts/NUSElections.sol");

contract('NUSElections', function(accounts) {
  before(async () => {
    NUSTokenInstance = await NUSToken.deployed();
    NUSElectionsInstance = await NUSElections.deployed();
  });

  console.log("Testing NUS Elections");

  it('Give Tokens to students and NUSElections contract', async() =>{
      await NUSTokenInstance.giveTokens(accounts[1],100);
      await NUSTokenInstance.giveTokens(accounts[2],200);
      await NUSTokenInstance.giveTokens(NUSElectionsInstance.address,10);

      
      let account1Balance = await NUSTokenInstance.balanceOf(accounts[1]);
      let account2Balance = await NUSTokenInstance.balanceOf(accounts[2]);
      let accountElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstance.address);

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

      assert.strictEqual(
        accountElectionsBalance.toNumber(),
        10,
        "Failed to give Tokens"
    )
  })

  it('Student 1 can vote for election option 0', async() => {
      await NUSElectionsInstance.vote(0, {from: accounts[1]});
      
      let getVotingChoice1 = await NUSElectionsInstance.getVotingChoice({from: accounts[1]})
      assert.strictEqual(getVotingChoice1.toNumber(), 0);
  });

  it('tallyVote cannot be called if minimum votes are not reached', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.tallyVote({from: accounts[0]}), "Election has not met minimum required number of voters.")
  });

  it('Student 2 can vote for election option 1', async() => {
    await NUSElectionsInstance.vote(1, {from: accounts[2]});
    
    let getVotingChoice1 = await NUSElectionsInstance.getVotingChoice({from: accounts[2]})
    assert.strictEqual(getVotingChoice1.toNumber(), 1);
  });

  it('tallyVote cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.tallyVote({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('getVotingResult cannot be called if election has not ended', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.getVotingResult({from: accounts[1]}), "Election not ended yet.")
  });

  it('tallyVote can be called by account that is the election owner', async() => {
    await NUSElectionsInstance.tallyVote({from: accounts[0]})

    let getElectionStatus0 = await NUSElectionsInstance.getElectionStatus({from: accounts[0]})
    assert.strictEqual(getElectionStatus0, true);
  });

  it('getVotingResult cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.getVotingResult({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('getVotingResult can be called by account that is the election owner, to emit winning event', async() => {
    getVotingResult0 = await NUSElectionsInstance.getVotingResult({from: accounts[0]})

    truffleAssert.eventEmitted(getVotingResult0, "winningVote");
  });

  it('getTotalVotes can be called to get correct total votes', async() => {
    let getTotalVotes0 = await NUSElectionsInstance.getTotalVotes({from: accounts[0]})

    assert.strictEqual(getTotalVotes0.toNumber(), 300);
  });

  it('showVotingResult can be called to get correct votes per option', async() => {
    let showVotingResult0 = await NUSElectionsInstance.showVotingResult({from: accounts[0]})

    assert.strictEqual(showVotingResult0.toString(), '100,200');
  });

  it('issueVotingReward cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.issueVotingReward({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('issueVotingReward can be called by account that is election owner', async() => {
    await NUSTokenInstance.modifyList(NUSElectionsInstance.address, 0, true, {from: accounts[0]});
    // whitelist election address

    let isAddressInWhitelistAddresses0 = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[0], {from: accounts[0]})
    let isElectionAddressInWhitelistAddresses = await NUSTokenInstance.isAddressInWhitelistAddresses(NUSElectionsInstance.address, {from: accounts[0]})

    assert.strictEqual(isAddressInWhitelistAddresses0, true);
    assert.strictEqual(isElectionAddressInWhitelistAddresses, true);


    await NUSElectionsInstance.issueVotingReward({from: accounts[0]})
    balance1 = await NUSTokenInstance.balanceOf(accounts[1]);
    balance2 = await NUSTokenInstance.balanceOf(accounts[2]);
    balanceElections = await NUSTokenInstance.balanceOf(NUSElectionsInstance.address);


    assert.strictEqual(balance1.toNumber(), 101);
    assert.strictEqual(balance2.toNumber(), 201);
    assert.strictEqual(balanceElections.toNumber(), 8);

  });

  it('withdraw cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.withdraw({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('withdraw can be called by account that is the election owner', async() => {
    await NUSElectionsInstance.withdraw({from: accounts[0]})

    let nusElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstance.address);

    assert.strictEqual(nusElectionsBalance.toNumber(), 0);
  });
});