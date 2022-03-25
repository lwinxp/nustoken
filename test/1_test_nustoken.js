const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

var NUSToken = artifacts.require("NUSToken");

contract("NUSToken", function(accounts) {

    before(async () => {
        NUSTokenInstance = await NUSToken.deployed();
    });
    console.log("Testing NUSToken Contract");

    // Check if all tokens are minted successfully
    it("Correct current supply of NUS Tokens", async () => {
        let numberOfNusTokens = await NUSTokenInstance.balanceOf(NUSTokenInstance.address);

        assert.notStrictEqual(
            numberOfNusTokens,
            ((2**256) - 1),
            "Incorrect token supply minted"
        );
    })

    // Giving Tokens to the accounts 1 and 2
    it('Gave tokens to accounts 1 and 2', async() =>{
        await NUSTokenInstance.giveTokens(accounts[1],100);
        await NUSTokenInstance.giveTokens(accounts[2],200);
  
        let account1Balance = await NUSTokenInstance.balanceOf(accounts[1]);
        let account2Balance = await NUSTokenInstance.balanceOf(accounts[2]);
  
        assert.strictEqual(
            account1Balance.toNumber(),
            100,
            "Failed to give Tokens for accounts[1]"
        )
  
        assert.strictEqual(
            account2Balance.toNumber(),
            200,
            "Failed to give Tokens for accounts[2]"
        )
    })

    // Sending tokens from supply pool to 1st account
    it("Send tokens from the Supply pool to accounts[1]", async () => {
        let account1Balance = await NUSTokenInstance.balanceOf(accounts[1])
        let gaveTokensFromSupply = await NUSTokenInstance.giveTokens(accounts[1], 1); // give 1 token
        let account1BalanceAfter = await NUSTokenInstance.balanceOf(accounts[1])

        assert.notStrictEqual(
            account1BalanceAfter,
            account1Balance + 1,
            "Giving token from supply pool failed"
        );
    })

    // Taking tokens from 1st account and sending to supply pool
    it("Take token from accounts[1]", async () => {
        let account1Balance = await NUSTokenInstance.balanceOf(accounts[1])
        let contractBalance = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)
        
        // take 1 token from accounts[1] and give to contract
        let gaveTokensFromSupply = await NUSTokenInstance.takeTokens(accounts[1], 1);

        let account1BalanceAfter = await NUSTokenInstance.balanceOf(accounts[1])
        let contractBalanceAfter = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)

        assert.notStrictEqual(
            account1BalanceAfter,
            account1Balance - 1,
            "Taking token from accounts[1] failed"
        );

        assert.notStrictEqual(
            contractBalanceAfter,
            contractBalance + 1,
            "Adding token to contract failed"
        );
    })

    // Fining tokens from 1st account
    it("Fine accounts[1]!", async () => {
        let account1Balance = await NUSTokenInstance.balanceOf(accounts[1])
        let contractBalance = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)

        // take 1 token from accounts[1] and give to contract
        let fineAccount = await NUSTokenInstance.fine(accounts[1], 1); 
        let account1BalanceAfter = await NUSTokenInstance.balanceOf(accounts[1])

        let contractBalanceAfter = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)

        assert.notStrictEqual(
            account1BalanceAfter,
            account1Balance - 1,
            "Taking token from accounts[1] failed"
        );

        assert.notStrictEqual(
            contractBalanceAfter,
            contractBalance + 1,
            "Adding token to contract failed"
        );
    })

    // Semesterly token distribution of students
    it("Semester Token Distribution", async () => {
        let account1Balance = await NUSTokenInstance.balanceOf(accounts[1])
        let contractBalance = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)

        // distribute 10000 tokens semesterly
        let distributeSemTokens = await NUSTokenInstance.semesterTokenDistribution(accounts[1]); 

        let account1BalanceAfter = await NUSTokenInstance.balanceOf(accounts[1])
        let contractBalanceAfter = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)


        assert.notStrictEqual(
            account1BalanceAfter,
            account1Balance + 10000,
            "Distributing tokens to accounts[1] failed"
        );

        assert.notStrictEqual(
            BigInt(contractBalanceAfter),
            BigInt(contractBalance - 10000),
            "Taking tokens from contract failed"
        );
    })

    // Taking tokens from graduating students and returning to pool
    it("Retrieve all tokens from graduating/leaving student", async () => {
        let account1Balance = await NUSTokenInstance.retrieveAllTokens(accounts[1])
        let contractBalance = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)

        let account1BalanceAfter = await NUSTokenInstance.balanceOf(accounts[1])
        let contractBalanceAfter = await NUSTokenInstance.balanceOf(NUSTokenInstance.address)


        assert.strictEqual(
            account1BalanceAfter.toNumber(),
            0,
            "Retrieving tokens from student failed"
        );

        assert.notStrictEqual(
            contractBalanceAfter,
            contractBalance + account1Balance,
            "Contract did not receive the correct amount of tokens"
        );
    })

    // Add/Remove address into whitelist addresses list and check if it is in
    it("Add/Remove address into whitelisted addresses and check if in whitelist addresses", async () => {

        // 0 refers to whitelist, true refers to adding to list
        let addAddrIntoList = await NUSTokenInstance.modifyList(accounts[1], 0, true) 
        let addressInList = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[1])
        
        assert.equal(
            addressInList,
            true,
            "Address is not in the whitelist even though added"
        );

        // 0 refers to whitelist, false refers to removing from list
        let removeAddrFromList = await NUSTokenInstance.modifyList(accounts[1], 0, false) 
        let addressInList2 = await NUSTokenInstance.isAddressInWhitelistAddresses(accounts[1])

        assert.equal(
            addressInList2,
            false,
            "Address is still in the whitelist even though removed"
        );
    })

    // Add/Remove address into blacklisted addresses list and check if it is in
    it("Add/Remove address into blacklisted addresses and check if in blacklisted addresses", async () => {

        // 1 refers to blacklist, true refers to adding to list
        let addAddrIntoList = await NUSTokenInstance.modifyList(accounts[1], 1, true) 
        let addressInList = await NUSTokenInstance.isAddressInBlacklistedAddresses(accounts[1])
        
        assert.equal(
            addressInList,
            true,
            "Address is not in the blacklist even though added"
        );

        // 1 refers to blacklist, false refers to removing from list
        let removeAddrFromList = await NUSTokenInstance.modifyList(accounts[1], 1, false) 
        let addressInList2 = await NUSTokenInstance.isAddressInBlacklistedAddresses(accounts[1])

        assert.equal(
            addressInList2,
            false,
            "Address is still in the blacklist even though removed"
        );
    })

    // Add/Remove address into list of addresses that can blacklist addresses and check if it is in
    it("Add/Remove address using addresses that are granted blacklist rights, and check functionality", async () => {

        // ADDING 

        // 2 refers to list of addresses that can blacklist addresses, true refers to adding to list
        let addAddrIntoList = await NUSTokenInstance.modifyList(accounts[1], 2, true) 
        let addressInList = await NUSTokenInstance.isAddressInCanBlacklistAddresses(accounts[1])
        
        assert.equal(
            addressInList,
            true,
            "1st Address cannot blacklist other addresses even though added"
        );

        // checking if this address can blacklist other addresses & checking if that address is in the blacklist
        let addAddrIntoBlacklist = await NUSTokenInstance.modifyBlacklist(accounts[2], true, {from: accounts[1]})
        let addressIsInBlacklist = await NUSTokenInstance.isAddressInBlacklistedAddresses(accounts[2], {from: accounts[1]})

        assert.equal(
            addressIsInBlacklist,
            true,
            "2nd address is not in the blacklist even though added"
        );

        // REMOVAL

        // 2 refers to list of addresses that can blacklist addresses, false refers to removing from list
        let removeAddrFromList = await NUSTokenInstance.modifyList(accounts[1], 2, false) 
        let addressInList2 = await NUSTokenInstance.isAddressInCanBlacklistAddresses(accounts[1])

        assert.equal(
            addressInList2,
            false,
            "Address can still blacklist other addresses even though removed"
        );

        // checking if this address can blacklist other addresses & checking if that address is in the blacklist
        await truffleAssert.reverts(
          NUSTokenInstance.modifyBlacklist(accounts[2], false, {from: accounts[1]}),
          "Not eligible to blacklist addressess"
        )
    })

    // Add/Remove address into list of addresses that can fine addresses and check if it is in
    it("Fine address using addresses that are granted rights to fine others, and check functionality", async () => {
        // ADDING 

        // 3 refers to list of addresses that can fine addresses, true refers to adding to list
        let addAddrIntoList = await NUSTokenInstance.modifyList(accounts[1], 3, true) 
        let addressInList = await NUSTokenInstance.isAddressInCanFineAddresses(accounts[1])
        
        assert.equal(
            addressInList,
            true,
            "1st Address cannot fine other addresses even though added"
        );

        // check if this address can fine other addresses
        await NUSTokenInstance.giveTokens(accounts[2], 10);
        let addrFined = await NUSTokenInstance.fine(accounts[2], 5, {from: accounts[1]});
        truffleAssert.eventEmitted(addrFined, "fined")

        // REMOVAL

        // 3 refers to list of addresses that can fine other addresses, false refers to removing from list
        let removeAddrFromList = await NUSTokenInstance.modifyList(accounts[1], 3, false) 
        let addressInList2 = await NUSTokenInstance.isAddressInCanFineAddresses(accounts[1])

        assert.equal(
            addressInList2,
            false,
            "Address can still fine other addresses even though removed"
        );

        // checking if this address can blacklist other addresses & checking if that address is in the blacklist
        await truffleAssert.reverts(
          NUSTokenInstance.fine(accounts[2], 5, {from: accounts[1]}),
          "Not an address that is allowed to fine"
        )
    })

});