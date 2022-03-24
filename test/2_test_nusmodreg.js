const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');


var NUSToken = artifacts.require("NUSToken");
var NUSModReg = artifacts.require("NUSModReg");

let mod1 = "0x6373313031300000000000000000000000000000000000000000000000000000";
let mod2 = "0x6d61313130317300000000000000000000000000000000000000000000000000";

let modQuota1 = 1;
let modQuota2 = 2;

contract('NUSModReg', function(accounts) {
    before(async () => {
        NUSTokenInstance = await NUSToken.deployed();
        NUSModRegInstance = await NUSModReg.deployed();
    });

    console.log("Testing NUS ModReg");

    it('Give Tokens', async() =>{
        await NUSTokenInstance.giveTokens(accounts[1],100);
        await NUSTokenInstance.giveTokens(accounts[2],200);
        
        let account1Balance = await NUSTokenInstance.balanceOf(accounts[1]);
        let account2Balance = await NUSTokenInstance.balanceOf(accounts[2]);

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

    it('Register Modules', async() =>{
        
        await NUSModRegInstance.registerModules([mod1,mod2],[modQuota1,modQuota2]);
        
        let modQuota1_ = await NUSModRegInstance.getModuleQuota(mod1);
        let modQuota2_ = await NUSModRegInstance.getModuleQuota(mod2);
        
        // console.log(modQuota1_);
        assert.strictEqual(
            modQuota1,
            modQuota1_.toNumber(),
            "Failed to map Quota"
        )

        assert.strictEqual(
            modQuota2,
            modQuota2_.toNumber(),
            "Failed to map Quota"
        )
        
    })

    it('Duplicate Modules Set', async() =>{
        let dupMod1 = "0x6373313031300000000000000000000000000000000000000000000000000000";
        let dupMod1Quota1 = 1;
        
        await truffleAssert.reverts(NUSModRegInstance.registerModules(
            [dupMod1],[dupMod1Quota1]),
            "Module Code has already been set"
        );
    })

    it('Bidding Works', async() =>{
        await NUSModRegInstance.bid(mod1, {from: accounts[1]});
        await NUSModRegInstance.bid(mod1, {from: accounts[2]});

        await NUSModRegInstance.bid(mod2, {from: accounts[1]});
        await NUSModRegInstance.bid(mod2, {from: accounts[2]});

        let bidModsArr1 = await NUSModRegInstance.getMyBidModules({from: accounts[1]});
        let bidModsArr2 = await NUSModRegInstance.getMyBidModules({from: accounts[2]});

        assert.strictEqual(
            bidModsArr1[0],
            mod1,
            "Failed to add Mods"
        )

        assert.strictEqual(
            bidModsArr1[1],
            mod2,
            "Failed to add Mods"
        )

        assert.strictEqual(
            bidModsArr2[0],
            mod1,
            "Failed to add Mods"
        )

        assert.strictEqual(
            bidModsArr2[1],
            mod2,
            "Failed to add Mods"
        )
    })

    it('Multiple Bidding Works', async() =>{
        await NUSModRegInstance.bid(mod1, {from: accounts[1]});

        let bidModsArr1 = await NUSModRegInstance.getMyBidModules({from: accounts[1]});

        assert.strictEqual(
            bidModsArr1.length,
            2,
            "Failed to handle Duplicates"
        )

    })

    it('Allocation Works', async() =>{
        await NUSModRegInstance.allocate();

        let modAllocation1 = await NUSModRegInstance.getMyAllocation({from: accounts[1]});
        let modAllocation2 = await NUSModRegInstance.getMyAllocation({from: accounts[2]});

        assert.strictEqual(
            modAllocation1[0],
            mod2,
            "Failed to Allocate Mods"
        )

        assert.strictEqual(
            modAllocation1[1],
            undefined,
            "Failed to give mod to student with more tokens"
        )

        assert.strictEqual(
            modAllocation2[0],
            mod1,
            "Failed to Allocate Mods"
        )

        assert.strictEqual(
            modAllocation2[1],
            mod2,
            "Failed to Allocate Mods"
        )

    })
    // TODO @Jin-Jiayu after we have a way to reset the allocation
    // it('Allocation Works with same Tokens', async() =>{
    

    // })

    
    
});
