const DST = artifacts.require('DST');

contract('DST', async (accounts) => {
  const owner = accounts[0];

  it('should put 1,000,000,000 DST in the first account', async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(accounts[0]);

    assert.equal(
      balance.valueOf(),
      1000000000 * 10 ** 18,
      '1,000,000,000 wasn\'t in the first account'
    );
  });

  describe('mint', () => {
    it('should raise an error when owner is trying to mint', async () => {
      let error = false;
      const DSTInstance = await DST.deployed();
      try {
        await DSTInstance.mint(owner, 10000000, { from: owner });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });
  });
});
