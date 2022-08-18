const Membership = artifacts.require("Membership");

contract("Membership", async (accounts) => {
  let membershipInstance;
  let block;

  const minterRole = web3.utils.keccak256("MINTER_ROLE");
  const bunnerRole = web3.utils.keccak256("BURNER_ROLE");
  const owner = accounts[0];
  const minter = accounts[1];
  const burner = accounts[2];

  beforeEach(async () => {
    membershipInstance = await Membership.deployed();
    block = await web3.eth.getBlock("latest");
  });

  describe("mint", () => {
    beforeEach(async () => {
      await membershipInstance.grantRole(minterRole, minter, { from: owner });
    });

    it("is not allowed for non minters", async () => {
      const id = 0;
      let error = false;

      try {
        await membershipInstance.mint(owner, id, 1, Buffer.from("data"), { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it("is allowed for minters", async () => {
      const id = 0;
      let error = false;

      await membershipInstance.grantRole(minterRole, minter, { from: owner });
      const prev = await membershipInstance.balanceOf(owner, id);

      try {
        await membershipInstance.mint(owner, id, 1, Buffer.from("data"), { from: minter });
      } catch (e) {
        error = true;
      }

      const current = await membershipInstance.balanceOf(owner, id);
      assert.equal(error, false);
      assert.equal(prev.toNumber() + 1, current.toNumber());
    });


    it ("only supports id ranges[0..3]", async () => {
      let error = false;
      for (let id = -1; id < 5; id++) {
        error = false;
        try {
          await membershipInstance.mint(owner, id, 1, Buffer.from("data"), { from: minter });
        } catch (e) {
          error = true;
        }
        assert.equal(error, id < 0 || id > 3);
      }
    });
  });
});
