const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');


var NUSToken = artifacts.require("../contracts/NUSToken.sol");
var NUSLibrary = artifacts.require("../contracts/NUSLibrary.sol");

contract('NUSLibrary', function(accounts) {
  before(async () => {
    NUSTokenInstance = await NUSToken.deployed();
    NUSLibraryInstance = await NUSLibrary.deployed();
  });

  console.log("Testing NUS Library");

  it('Add to blacklist', async() =>{
    await NUSTokenInstance.modifyList(NUSLibraryInstance.address, 2, true);
    let bl_student = await NUSLibraryInstance.addToBlacklist(accounts[2]);
    truffleAssert.eventEmitted(bl_student, 'blacklistUpdated');
  })

  it('Assign fine to student', async() => {
    let student_fine = await NUSLibraryInstance.assignFine(accounts[2], 50);
    truffleAssert.eventEmitted(student_fine, 'fineAssigned');
  })
    
  it('Fine collected from student', async() => {
    await NUSTokenInstance.modifyList(NUSLibraryInstance.address, 3, true); // can fine 
    await NUSTokenInstance.giveTokens(accounts[2],100); // give tokens to account 9 for testing purposes 
    let student_paid = await NUSLibraryInstance.removeFromBlacklist(accounts[2]);
    truffleAssert.eventEmitted(student_paid, 'fineCollected');
    truffleAssert.eventEmitted(student_paid, 'blacklistUpdated');
  })
})
