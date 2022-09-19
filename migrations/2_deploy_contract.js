const DSP = artifacts.require('DSP');
const DSPTreasury = artifacts.require('DSPTreasury');
const DST = artifacts.require('DST');
const DSTTreasury = artifacts.require('DSTTreasury');
const Membership = artifacts.require('Membership');
const MembershipTreasury = artifacts.require('MembershipTreasury');
const Benefit = artifacts.require('Benefit');
const BenefitTreasury = artifacts.require('BenefitTreasury');
const Achievement = artifacts.require('Achievement');
const Vesting = artifacts.require('Vesting');

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
  deployer.deploy(Vesting);
};
