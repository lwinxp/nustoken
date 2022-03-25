const ERC20 = artifacts.require("ERC20");
const NUSToken = artifacts.require("NUSToken");
const NUSModReg = artifacts.require("NUSModReg");
const NUSElections = artifacts.require("NUSElections");
const NUSLibrary = artifacts.require("NUSLibrary");

module.exports = async function(deployer) {
  await deployer.deploy(ERC20);
	await deployer.deploy(NUSToken);
  await deployer.deploy(NUSModReg, NUSToken.address);
  await deployer.deploy(NUSElections, [0,1], 2, 1, NUSToken.address);
  await deployer.deploy(NUSLibrary, NUSToken.address);
};