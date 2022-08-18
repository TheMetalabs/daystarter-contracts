const DST = artifacts.require("DST");
const DSP = artifacts.require("DSP");
const DSTTreasury = artifacts.require("DSTTreasury");
const DSPTreasury = artifacts.require("DSPTreasury");

module.exports = function (deployer) {
  deployer.deploy(DST);
  deployer.deploy(DSP);
  deployer.deploy(DSTTreasury);
  deployer.deploy(DSPTreasury);
};
