const Benefit = artifacts.require('Benefit');

contract('Benefit', async (accounts) => {
  let benefitInstance;
  let block;

  const owner = accounts[0];
  const minter = accounts[0];
  const noPermissioner = accounts[3];

  before(async () => {
    benefitInstance = await Benefit.deployed();
    block = await web3.eth.getBlock('latest');
  });

  describe('mint', () => {
    it('is not allowed for non-minters', async () => {
      const id = 0;
      let error = false;
      try {
        await benefitInstance.mint(owner, id, Buffer.from(''), { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      const id = 0;
      let error = false;
      try {
        await benefitInstance.mint(owner, id, Buffer.from(''), { from: minter });
      } catch (e) {
        error = true;
      }

      const _owner = await benefitInstance.ownerOf(id);
      assert.equal(owner, _owner);
      assert.equal(error, false);
    });
  });

  describe('setURI', () => {
    it('is not allowed for non-minter', async () => {
      let error = false;
      try {
        await benefitInstance.setURI('https://opensea.io', { from: noPermissioner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      let error = false;
      try {
        await benefitInstance.setURI('https://opensea.io', { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });
  });

  describe('tokenURI', () => {
    beforeEach(async () => {
      await benefitInstance.setURI('', { from: owner });
    });

    it('return empty string when no URI is setted', async () => {
      const id = 0;
      const tokenURI = await benefitInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, '');
    });

    it('return URL with json extension when URI is setted', async () => {
      const id = 0;
      await benefitInstance.setURI('https://opensea.io', { from: minter });
      const tokenURI = await benefitInstance.tokenURI(id, { from: noPermissioner });
      assert.equal(tokenURI, `https://opensea.io/${id}.json`);
    });
  });
});
