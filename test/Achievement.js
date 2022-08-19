const Achievement = artifacts.require("Achievement");

contract("Achievement", async (accounts) => {
  let achievementInstance;
  let block;

  const minterRole = web3.utils.keccak256("MINTER_ROLE");
  const owner = accounts[0];
  const minter = accounts[1];
  const noPermissioner = accounts[3];
  const nftOwner = accounts[4];
  const receiver = accounts[5];

  beforeEach(async () => {
    achievementInstance = await Benefit.deployed();
    block = await web3.eth.getBlock("latest");
  });

  describe("mint", () => {
    beforeEach(async () => {
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
    });

    it("is not allowed for nont minters", async () => {
      const id = 0;

      let error = false;
      try {
        await achievementInstance.mint(nftOwner, id, Buffer.from(""), { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await achievementInstance.mint(nftOwner, id, Buffer.from(""), { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await achievementInstance.mint(nftOwner, id, Buffer.from(""), { from: nftOwner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it("is allowed for minter", async () => {
      const id = 0;
      let error = false;
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
      try {
        await achievementInstance.mint(nftOwner, id, Buffer.from(""), { from: minter });
      } catch (e) {
        error = true;
      }

      const _owner = await achievementInstance.ownerOf(id);
      assert.equal(nftOwner, _owner);
      assert.equal(error, false);
    });
  });

  describe("setURI", () => {
    beforeEach(async () => {
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
    });

    it("is not allowed for non-owner", async () => {
      let error = false;
      try {
        await achievementInstance.setURI("https://opensea.io", { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await achievementInstance.setURI("https://opensea.io", { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it("is allowed for owner", async () => {
      let error = false;
      try {
        await achievementInstance.setURI("https://opensea.io", { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });
  });

  describe("tokenURI", () => {
    beforeEach(async () => {
      await achievementInstance.setURI("", { from: owner });
    });

    it("return empty string when no URI is setted", async () => {
      const id = 0;
      const tokenURI = await achievementInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, "");
    });

    it("return URL with json extension when URI is setted", async () => {
      const id = 0;
      await achievementInstance.setURI("https://opensea.io", { from: owner });
      const tokenURI = await achievementInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, `https://opensea.io/${id}.json`);
    });
  });

  describe("transfer", () => {
    const id = 0;

    beforeEach(async () => {
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
      await achievementInstance.mint(nftOwner, id, Buffer.from(""), { from: minter });
    });

    it("raise error when nft ower is trying to transfer", async () => {
      let error = false;
      try {
        await achievementInstance.transferFrom(nftOwner, receiver, id, { from: nftOwner });
      } catch (error) {
        error = true
      }
      assert.equal(error, true);
    });
  });
});
