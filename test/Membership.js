const Membership = artifacts.require('Membership');

contract('Membership', async (accounts) => {
  let membershipInstance;
  let block;

  const owner = accounts[0];
  const minter = accounts[0];
  const noPermissioner = accounts[3];

  before(async () => {
    membershipInstance = await Membership.deployed();
    block = await web3.eth.getBlock('latest');
  });

  describe('mint', () => {
    it('is not allowed for nont minters', async () => {
      const id = 0;
      let error = false;
      try {
        await membershipInstance.mint(owner, id, Buffer.from(''), { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      const id = 0;
      let error = false;
      try {
        await membershipInstance.mint(owner, id, Buffer.from(''), { from: minter });
      } catch (e) {
        error = true;
      }

      const _owner = await membershipInstance.ownerOf(id);
      assert.equal(owner, _owner);
      assert.equal(error, false);
    });
  });

  describe('setURI', () => {
    it('is not allowed for non-minter', async () => {
      let error = false;
      try {
        await membershipInstance.setURI('https://opensea.io', { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      let error = false;
      try {
        await membershipInstance.setURI('https://opensea.io', { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });
  });

  describe('tokenURI', () => {
    beforeEach(async () => {
      await membershipInstance.setURI('', { from: minter });
    });

    it('return empty string when no URI is setted', async () => {
      const id = 0;
      const tokenURI = await membershipInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, '');
    });

    it('return URL with json extension when URI is setted', async () => {
      const id = 0;
      await membershipInstance.setURI('https://opensea.io', { from: minter });
      const tokenURI = await membershipInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, `https://opensea.io/${id}.json`);
    });
  });
});
