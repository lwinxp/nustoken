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
    
    let getVotingChoice2 = await NUSElectionsInstance.getVotingChoice({from: accounts[2]})
    assert.strictEqual(getVotingChoice2.toNumber(), 1);
  });

  it('tallyVote cannot be called by account that is not election owner', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.tallyVote({from: accounts[1]}), "Only election owner can perform this action.")
  });

  it('getVotingResult cannot be called if election has not ended', async() => {
    await truffleAssert.reverts(NUSElectionsInstance.getVotingResult({from: accounts[1]}), "Election not ended yet.")
  });

  it('tallyVote can be called by account that is the election owner', async() => {
    await NUSElectionsInstance.tallyVote({from: accounts[0]})

    let getElectionStatus1 = await NUSElectionsInstance.getElectionStatus({from: accounts[1]})
    assert.strictEqual(getElectionStatus1, true);
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
    let showVotingResult1 = await NUSElectionsInstance.showVotingResult({from: accounts[1]})

    assert.strictEqual(showVotingResult1.toString(), '100,200');
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

  it('NUSElections can have draw result', async() => {
    await NUSTokenInstance.giveTokens(accounts[3],200);
    await NUSTokenInstance.giveTokens(accounts[4],200);
    await NUSTokenInstance.giveTokens(NUSElectionsInstanceDraw.address,10);

    let account3Balance = await NUSTokenInstance.balanceOf(accounts[3]);
    let account4Balance = await NUSTokenInstance.balanceOf(accounts[4]);
    let accountElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstanceDraw.address);

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
      10,
      "Failed to give Tokens"
    )

    await NUSElectionsInstanceDraw.vote(0, {from: accounts[3]});
    
    let getVotingChoice3 = await NUSElectionsInstanceDraw.getVotingChoice({from: accounts[3]})
    assert.strictEqual(getVotingChoice3.toNumber(), 0);

    await NUSElectionsInstanceDraw.vote(1, {from: accounts[4]});
    
    let getVotingChoice4 = await NUSElectionsInstanceDraw.getVotingChoice({from: accounts[4]})
    assert.strictEqual(getVotingChoice4.toNumber(), 1);

    await NUSElectionsInstanceDraw.tallyVote({from: accounts[0]})

    let getElectionStatus3 = await NUSElectionsInstanceDraw.getElectionStatus({from: accounts[3]})
    assert.strictEqual(getElectionStatus3, true);

    getVotingResult0 = await NUSElectionsInstanceDraw.getVotingResult({from: accounts[0]})

    truffleAssert.eventEmitted(getVotingResult0, "draw");

    let showVotingResult3 = await NUSElectionsInstanceDraw.showVotingResult({from: accounts[3]})

    assert.strictEqual(showVotingResult3.toString(), '200,200');

    await NUSTokenInstance.modifyList(NUSElectionsInstanceDraw.address, 0, true, {from: accounts[0]});

    let isAddressInWhitelistAddresses0 = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[0], {from: accounts[0]})
    let isElectionDrawAddressInWhitelistAddresses = await NUSTokenInstance.isAddressInWhitelistAddresses(NUSElectionsInstanceDraw.address, {from: accounts[0]})

    assert.strictEqual(isAddressInWhitelistAddresses0, true);
    assert.strictEqual(isElectionDrawAddressInWhitelistAddresses, true);

    await NUSElectionsInstanceDraw.issueVotingReward({from: accounts[0]})
    balance3 = await NUSTokenInstance.balanceOf(accounts[3]);
    balance4 = await NUSTokenInstance.balanceOf(accounts[4]);
    balanceElections = await NUSTokenInstance.balanceOf(NUSElectionsInstanceDraw.address);

    assert.strictEqual(balance3.toNumber(), 201);
    assert.strictEqual(balance4.toNumber(), 201);
    assert.strictEqual(balanceElections.toNumber(), 8);
  });
});

// initialised new instance of NUSElections instead of use new contract block

// // contract('NUSElections Draw Result', function(accounts) {
// //   before(async () => {
// //     NUSTokenInstance = await NUSToken.deployed();
// //     NUSElectionsInstanceDraw = await NUSElections.deployed();
// //   });

// //   console.log("Testing NUS Elections Draw Result");

// //   it('NUSElections can have draw result', async() => {
// //     await NUSTokenInstance.giveTokens(accounts[3],200);
// //     await NUSTokenInstance.giveTokens(accounts[4],200);
// //     await NUSTokenInstance.giveTokens(NUSElectionsInstanceDraw.address,10);

// //     let account3Balance = await NUSTokenInstance.balanceOf(accounts[3]);
// //     let account4Balance = await NUSTokenInstance.balanceOf(accounts[4]);
// //     let accountElectionsBalance = await NUSTokenInstance.balanceOf(NUSElectionsInstanceDraw.address);

// //     assert.strictEqual(
// //         account3Balance.toNumber(),
// //         200,
// //         "Failed to give Tokens"
// //     )

// //     assert.strictEqual(
// //         account4Balance.toNumber(),
// //         200,
// //         "Failed to give Tokens"
// //     )

// //     assert.strictEqual(
// //       accountElectionsBalance.toNumber(),
// //       10,
// //       "Failed to give Tokens"
// //     )

// //     await NUSElectionsInstanceDraw.vote(0, {from: accounts[3]});
    
// //     let getVotingChoice3 = await NUSElectionsInstanceDraw.getVotingChoice({from: accounts[3]})
// //     assert.strictEqual(getVotingChoice3.toNumber(), 0);

// //     await NUSElectionsInstanceDraw.vote(1, {from: accounts[4]});
    
// //     let getVotingChoice4 = await NUSElectionsInstanceDraw.getVotingChoice({from: accounts[4]})
// //     assert.strictEqual(getVotingChoice4.toNumber(), 1);

// //     await NUSElectionsInstanceDraw.tallyVote({from: accounts[0]})

// //     let getElectionStatus3 = await NUSElectionsInstanceDraw.getElectionStatus({from: accounts[3]})
// //     assert.strictEqual(getElectionStatus3, true);

// //     getVotingResult0 = await NUSElectionsInstanceDraw.getVotingResult({from: accounts[0]})

// //     truffleAssert.eventEmitted(getVotingResult0, "draw");

// //     let showVotingResult3 = await NUSElectionsInstanceDraw.showVotingResult({from: accounts[3]})

// //     assert.strictEqual(showVotingResult3.toString(), '200,200');

// //     await NUSTokenInstance.modifyList(NUSElectionsInstanceDraw.address, 0, true, {from: accounts[0]});

// //     let isAddressInWhitelistAddresses0 = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[0], {from: accounts[0]})
// //     let isElectionDrawAddressInWhitelistAddresses = await NUSTokenInstance.isAddressInWhitelistAddresses(NUSElectionsInstanceDraw.address, {from: accounts[0]})

// //     assert.strictEqual(isAddressInWhitelistAddresses0, true);
// //     assert.strictEqual(isElectionDrawAddressInWhitelistAddresses, true);

// //     await NUSElectionsInstanceDraw.issueVotingReward({from: accounts[0]})
// //     balance3 = await NUSTokenInstance.balanceOf(accounts[3]);
// //     balance4 = await NUSTokenInstance.balanceOf(accounts[4]);
// //     balanceElections = await NUSTokenInstance.balanceOf(NUSElectionsInstanceDraw.address);

// //     assert.strictEqual(balance3.toNumber(), 201);
// //     assert.strictEqual(balance4.toNumber(), 201);
// //     assert.strictEqual(balanceElections.toNumber(), 8);
// //   });
// });