const DSP = artifacts.require('DSP');
const DSPTreasury = artifacts.require('DSPTreasury');

contract('DSPTreasury', async (accounts) => {
  let dspTreasuryInstance;
  let dspInstance;
  const minter = accounts[0];
  const dspHolder = accounts[1];
  const dspReceiver = accounts[2];

  before(async () => {
    dspTreasuryInstance = await DSPTreasury.deployed();
    dspInstance = await DSP.deployed();
    await dspTreasuryInstance.setTokenAddress(dspInstance.address, {
      from: minter
    });
  });

  it('should put 0 DSP in the first account', async () => {
    const balance = await dspInstance.balanceOf(minter);
    assert.equal(balance.valueOf(), 0, "0 wasn't in the first account");
  });

  it('0 DSP in treasury', async () => {
    const balance = await dspInstance.balanceOf(dspTreasuryInstance.address);
    assert.equal(balance.valueOf(), 0, "0 wasn't in the treasury");
  });

  describe('deposit', () => {
    before(async () => {
      await dspInstance.mint(dspHolder, 200, { from: minter });
    });

    it('is not allowed for non holder', async () => {
      let error = false;
      try {
        await dspTreasuryInstance.deposit(10, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for holder', async () => {
      let error = false;
      const amount = 10;
      try {
        await dspInstance.approve(dspTreasuryInstance.address, amount, { from: dspHolder });
        await dspTreasuryInstance.deposit(amount, { from: dspHolder });
      } catch (e) {
        console.error(e);
        error = true;
      }
      assert.equal(error, false);
    });

    it('increase treasury balance', async () => {
      const amount = 20;
      const prevBalance = await dspInstance.balanceOf(dspTreasuryInstance.address);

      await dspInstance.approve(dspTreasuryInstance.address, amount, { from: dspHolder });
      await dspTreasuryInstance.deposit(amount, { from: dspHolder });

      const balance = await dspInstance.balanceOf.call(dspTreasuryInstance.address);
      assert.equal(balance.toNumber(0), prevBalance.toNumber() + amount);
    });

    it('decrease user balance', async () => {
      const amount = 20;
      const prevBalance = await dspInstance.balanceOf.call(dspHolder);

      await dspInstance.approve(dspTreasuryInstance.address, amount, { from: dspHolder });
      await dspTreasuryInstance.deposit(amount, { from: dspHolder });

      const balance = await dspInstance.balanceOf.call(dspHolder);
      assert.equal(balance.toNumber(), prevBalance.toNumber() - amount);
    });

    it('fail when deposit amount is greater then user balance', async () => {
      const prevBalance = await dspInstance.balanceOf(dspHolder);
      const amount = prevBalance.toNumber() + 1;
      let error = false;
      try {
        await dspInstance.approve(dspTreasuryInstance.address, amount, { from: dspHolder });
        await dspTreasuryInstance.deposit(amount, { from: dspHolder });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });
  });

  describe('withdraw', () => {
    before(async () => {
      await dspInstance.mint(dspTreasuryInstance.address, 200, { from: minter });
    });

    it('is not allowed for non holder', async () => {
      let error = false;
      try {
        await dspTreasuryInstance.withdraw(dspReceiver, 10, { from: dspReceiver });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      let error = false;
      try {
        await dspTreasuryInstance.withdraw(dspReceiver, 10, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });

    it('decrease treasury balance', async () => {
      const amount = 20;
      const prevBalance = await dspInstance.balanceOf.call(dspTreasuryInstance.address);

      await dspTreasuryInstance.withdraw(dspReceiver, amount, { from: minter });

      const balance = await dspInstance.balanceOf.call(dspTreasuryInstance.address);
      assert.equal(balance.toNumber(), prevBalance.toNumber() - amount);
    });

    it('increase user balance', async () => {
      const amount = 20;
      const prevBalance = await dspInstance.balanceOf.call(dspReceiver);

      await dspTreasuryInstance.withdraw(dspReceiver, amount, { from: minter });

      const balance = await dspInstance.balanceOf.call(dspReceiver);
      assert.equal(balance.toNumber(), prevBalance.toNumber() + amount);
    });
  });
});
