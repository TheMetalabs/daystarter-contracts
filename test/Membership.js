const Membership = artifacts.require("Membership");

contract("Membership", async (accounts) => {
  let membershipInstance;
  let block;

  const minterRole = web3.utils.keccak256("MINTER_ROLE");
  const bunnerRole = web3.utils.keccak256("BURNER_ROLE");
  const owner = accounts[0];
  const minter = accounts[1];
  const burner = accounts[2];
  const noPermissioner = accounts[3];

  beforeEach(async () => {
    membershipInstance = await Membership.deployed();
    block = await web3.eth.getBlock("latest");
  });

  describe("mint", () => {
    beforeEach(async () => {
      await membershipInstance.grantRole(minterRole, minter, { from: owner });
      await membershipInstance.grantRole(bunnerRole, burner, { from: owner });
    });

    it("is not allowed for nont minters", async () => {
      const id = 0;
      let error = false;

      try {
        await membershipInstance.mint(owner, id, Buffer.from(""), { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;

      try {
        await membershipInstance.mint(owner, id, Buffer.from(""), { from: burner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;

      try {
        await membershipInstance.mint(owner, id, Buffer.from(""), { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

    });

    it("is allowed for minter", async () => {
      const id = 0;
      let error = false;
      await membershipInstance.grantRole(minterRole, minter, { from: owner });
      try {
        await membershipInstance.mint(owner, id, Buffer.from(""), { from: minter });
      } catch (e) {
        error = true;
      }

      const _owner = await membershipInstance.ownerOf(id);
      assert.equal(owner, _owner);
      assert.equal(error, false);
    });
  });

  describe("setURI", () => {
    beforeEach(async () => {
      await membershipInstance.grantRole(minterRole, minter, { from: owner });
      await membershipInstance.grantRole(bunnerRole, burner, { from: owner });
    });

    it("is not allowed for non-owner", async () => {
      let error = false;
      try {
        await membershipInstance.setURI("https://opensea.io", { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await membershipInstance.setURI("https://opensea.io", { from: burner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await membershipInstance.setURI("https://opensea.io", { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it("is allowed for owner", async () => {
      let error = false;
      try {
        await membershipInstance.setURI("https://opensea.io", { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });
  });

  describe("tokenURI", () => {
    beforeEach(async () => {
      await membershipInstance.setURI("", { from: owner });
    });

    it("return empty string when no URI is setted", async () => {
      const id = 0;
      const tokenURI = await membershipInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, "");
    });

    it("return URL with json extension when URI is setted", async () => {
      const id = 0;
      await membershipInstance.setURI("https://opensea.io", { from: owner });
      const tokenURI = await membershipInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, `https://opensea.io/${id}.json`);
    });
  });
});
