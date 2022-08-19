const Achievement = artifacts.require("Achievement");

contract("Achievement", async (accounts) => {
  let achievementInstance;
  let block;
  let nftId = 0;

  const minterRole = web3.utils.keccak256("MINTER_ROLE");
  const owner = accounts[0];
  const minter = accounts[1];
  const noPermissioner = accounts[3];
  const nftOwner = accounts[4];
  const receiver = accounts[5];

  before(async () => {
    achievementInstance = await Achievement.deployed();
    block = await web3.eth.getBlock("latest");
  });

  describe("mint", () => {
    before(async () => {
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
    });

    it("is not allowed for nont minters", async () => {
      error = false;
      try {
        await achievementInstance.mint(nftOwner, nftId, Buffer.from(""), { from: noPermissioner });
        nftId++;
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await achievementInstance.mint(nftOwner, nftId, Buffer.from(""), { from: nftOwner });
        nftId++;
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it("is allowed for minter", async () => {
      let error = false;
      const _nftId = nftId;
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
      try {
        await achievementInstance.mint(nftOwner, _nftId, Buffer.from(""), { from: minter });
        nftId++;
      } catch (e) {
        error = true;
      }

      const _owner = await achievementInstance.ownerOf(_nftId);
      assert.equal(nftOwner, _owner);
      assert.equal(error, false);
    });
  });

  describe("setURI", () => {
    before(async () => {
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
    let _nftId;

    before(async () => {
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
      await achievementInstance.mint(nftOwner, nftId, Buffer.from(""), { from: minter });
      _nftId = nftId;
      nftId++;
    });

    beforeEach(async () => {
      await achievementInstance.setURI("", { from: owner });
    });

    it("return empty string when no URI is setted", async () => {
      const tokenURI = await achievementInstance.tokenURI(_nftId, { from: noPermissioner });
      assert.equal(tokenURI, "");
    });

    it("return URL with json extension when URI is setted", async () => {
      await achievementInstance.setURI("https://opensea.io", { from: owner });
      const tokenURI = await achievementInstance.tokenURI(_nftId, { from: noPermissioner });
      assert.equal(tokenURI, `https://opensea.io/${_nftId}.json`);
    });
  });

  describe("transfer", () => {
    before(async () => {
      await achievementInstance.grantRole(minterRole, minter, { from: owner });
    });

    it("raise error when nft ower is trying to transfer", async () => {
      await achievementInstance.mint(nftOwner, nftId, Buffer.from(""), { from: minter });
      nftId++;

      let error = false;
      try {
        await achievementInstance.transferFrom(nftOwner, receiver, nftId, { from: nftOwner });
      } catch (e) {
        error = true
      }
      assert.equal(error, true);
    });

    it("raise error when admin is trying to transfer", async () => {
      await achievementInstance.mint(nftOwner, nftId, Buffer.from(""), { from: minter });
      nftId++;

      let error = false;
      try {
        await achievementInstance.transferFrom(nftOwner, receiver, nftId, { from: owner });
      } catch (e) {
        error = true
      }
      assert.equal(error, true);
    });

    it("raise error when minter is trying to transfer", async () => {
      await achievementInstance.mint(nftOwner, nftId, Buffer.from(""), { from: minter });
      nftId++;

      let error = false;
      try {
        await achievementInstance.transferFrom(nftOwner, receiver, nftId, { from: minter });
      } catch (e) {
        error = true
      }
      assert.equal(error, true);
    });
  });
});
