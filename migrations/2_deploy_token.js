const { BN} = require('@openzeppelin/test-helpers');
const MulaToken = artifacts.require("MulaToken");
const MulaTokenCrowdSale = artifacts.require("MulaTokenCrowdSale");
const MulaInvestorsVault = artifacts.require("MulaInvestorsVault");
const { DateTime } = require("luxon");

module.exports = async function (deployer,network,accounts) {

  await deployer.deploy(MulaToken);
  const token = await MulaToken.deployed();
  var wallet = accounts[4];
  var crowdsaleSupply =  "45000000000000000000000000";
  var lockedFunds     =  "55000000000000000000000000";
  var startTime = Math.trunc(DateTime.now().toLocal().plus({minutes:1}).toSeconds());
  //var endTime = Math.trunc(DateTime.now().toLocal().plus({ months: 3 ,hours:23,minutes:60,seconds:60}).toSeconds());
  var endTime = Math.trunc(DateTime.now().toLocal().plus({ days: 8}).toSeconds());
  var DevMarketing = accounts[9];
  var FounderFund1 = accounts[8];
  var FounderFund2 = accounts[7];
  var ListingLiquidity = accounts[6];
  var OperationsManagement = accounts[5];
  await token.setReleaser(accounts[0]);
  
  await deployer.deploy(MulaInvestorsVault,token.address);
  const vault = await MulaInvestorsVault.deployed();
  await token.transfer(vault.address,lockedFunds);

  await deployer.deploy(
    MulaTokenCrowdSale,
    token.address,vault.address,startTime,
    endTime, wallet,DevMarketing,
    FounderFund1,FounderFund2,
    ListingLiquidity,OperationsManagement
    );
  const crowdsale = await MulaTokenCrowdSale.deployed();
  await token.transfer(crowdsale.address,crowdsaleSupply);
  await token.setReleaser(crowdsale.address);

  await vault.setOperator(crowdsale.address);

  //transfer ownership to crowdsaleaddress && block.timestamp <= _endTime,

  return true;
};
