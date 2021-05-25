const MulaToken = artifacts.require("MulaToken");
const MulaTokenCrowdSale = artifacts.require("MulaTokenCrowdSale");
const Owned = artifacts.require("Owned");

module.exports = async function (deployer,network,accounts) {
  await deployer.deploy(MulaToken);
  const token = await MulaToken.deployed();
  await deployer.deploy(Owned);
  
  var rate = 1000000000000000; // in wei == 0.001 eth
  var wallet = accounts[1];

  await deployer.deploy(MulaTokenCrowdSale,rate,wallet,token.address);
  const crowdsale = await MulaTokenCrowdSale.deployed();

  
  token.setReleaser(accounts[0]);
  token.transfer(crowdsale.address,20000000);
  token.setReleaser(crowdsale.address);

  return true;
};
