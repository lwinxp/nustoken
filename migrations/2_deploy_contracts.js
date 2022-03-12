const ERC20 = artifacts.require("ERC20");
const Pool = artifacts.require("Pool");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(ERC20).then(function() {
      return deployer.deploy(Pool);
    });
  };