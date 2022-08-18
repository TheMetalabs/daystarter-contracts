const Membership = artifacts.require("Membership");

module.exports = function (deployer) {
  deployer.deploy(Membership, "https://opensea.io/");
};
