const MembershipTreasury = artifacts.require('MembershipTreasury');
const Membership = artifacts.require('Membership');
const DST = artifacts.require('DST');

contract('MembershipTreasury', async (accounts) => {
  let benefitTreasuryInstance;
  let nftId = 0;

  const minterRole = web3.utils.keccak256('MINTER_ROLE');
  const owner = accounts[0];
  const minter = accounts[0];
  const nftOwner = accounts[2];

  before(async () => {
    benefitTreasuryInstance = await MembershipTreasury.deployed();
    benefitInstance = await Membership.deployed();
    dstInstance = await DST.deployed();
  });

  describe('setAddress', () => {
    before(async () => {
      await benefitTreasuryInstance.grantRole(minterRole, minter, { from: owner });
    });

    it('is not allowed for non minters', async () => {
      error = false;
      try {
        await benefitTreasuryInstance.setAddress(benefitInstance.address, { from: nftOwner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      let error = false;
      try {
        await benefitTreasuryInstance.setAddress(benefitInstance.address, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });

    it('is only allowed for ERC721', async () => {
      let error = false;
      try {
        await benefitTreasuryInstance.setAddress(dstInstance.address, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await benefitTreasuryInstance.setAddress(benefitInstance.address, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });
  });

  describe('deposit', () => {
    let _nftIdA;
    let _nftIdB;

    before(async () => {
      await benefitTreasuryInstance.setAddress(benefitInstance.address);

      await benefitInstance.mint(nftOwner, nftId, Buffer.from(''), { from: minter });
      _nftIdA = nftId;
      nftId++;

      await benefitInstance.mint(nftOwner, nftId, Buffer.from(''), { from: minter });
      _nftIdB = nftId;
      nftId++;
    });

    it('is not allowed for non nft owner', async () => {
      let error = false;
      try {
        await benefitTreasuryInstance.deposit(_nftIdA, { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      error = false;
      try {
        await benefitTreasuryInstance.deposit(_nftIdA, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for nft owner', async () => {
      let error = false;

      try {
        await benefitInstance.approve(benefitTreasuryInstance.address, _nftIdA, { from: nftOwner });
        await benefitTreasuryInstance.deposit(_nftIdA, { from: nftOwner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);

      const _nftOwnerAddress = await benefitInstance.ownerOf(_nftIdA);
      assert.equal(_nftOwnerAddress, benefitTreasuryInstance.address);
    });
  });

  describe('withdraw', () => {
    let _nftIdA;
    let _nftIdB;

    before(async () => {
      await benefitTreasuryInstance.setAddress(benefitInstance.address);

      await benefitInstance.mint(nftOwner, nftId, Buffer.from(''), { from: minter });
      _nftIdA = nftId;
      nftId++;

      await benefitInstance.mint(nftOwner, nftId, Buffer.from(''), { from: minter });
      _nftIdB = nftId;
      nftId++;

      await benefitInstance.approve(benefitTreasuryInstance.address, _nftIdA, { from: nftOwner });
      await benefitTreasuryInstance.deposit(_nftIdA, { from: nftOwner });
    });

    it('is not allowed for non minter', async () => {
      let error = false;
      try {
        await benefitTreasuryInstance.withdraw(nftOwner, _nftIdA, { from: nftOwner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      let error = false;
      try {
        await benefitTreasuryInstance.withdraw(nftOwner, _nftIdA, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);

      const _nftOwnerAddress = await benefitInstance.ownerOf(_nftIdA);
      assert.equal(_nftOwnerAddress, nftOwner);
    });

    it('is allowed for nft which contract has', async () => {
      let error = false;
      try {
        await benefitTreasuryInstance.withdraw(nftOwner, _nftIdB, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });
  });
});
