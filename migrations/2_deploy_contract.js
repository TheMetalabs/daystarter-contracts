const DSP = artifacts.require("DSP");
const DST = artifacts.require("DST");
const DSPTreasury = artifacts.require("DSPTreasury");
const DSTTreasury = artifacts.require("DSTTreasury");
const MembershipTreasury = artifacts.require("MembershipTreasury");

module.exports = function (deployer) {
  deployer.deploy(DSP);
  deployer.deploy(DST);
  deployer.deploy(DSPTreasury);
  deployer.deploy(DSTTreasury);
  deployer.deploy(MembershipTreasury);
};
