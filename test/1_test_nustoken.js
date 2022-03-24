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
            "Taking token from accounts[1] failed"
        );

        assert.notStrictEqual(
            contractBalanceAfter,
            contractBalance - 10000,
            "Taking token from contract failed"
        );
    })


});