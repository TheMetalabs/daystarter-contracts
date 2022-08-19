const DSPTreasury = artifacts.require("DSPTreasury");
const DSTTreasury = artifacts.require("DSTTreasury");
const Membership = artifacts.require("Membership");
const Benefit = artifacts.require("Benefit");
const MembershipTreasury = artifacts.require("MembershipTreasury");
const Achievement = artifacts.require("Achievement");
const BenefitTreasury = artifacts.require("BenefitTreasury");
const DSTNFTreasury = artifacts.require("DSTNFTreasury");

module.exports = function (deployer) {
  deployer.deploy(DSP);
  deployer.deploy(DST);
  deployer.deploy(DSPTreasury);
  deployer.deploy(DSTTreasury);
  deployer.deploy(Membership);
  deployer.deploy(Benefit);
  deployer.deploy(MembershipTreasury);
  deployer.deploy(Achievement);
  deployer.deploy(BenefitTreasury);
  deployer.deploy(DSTNFTreasury);
};
