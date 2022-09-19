const { BN } = require('bn.js');

const DST = artifacts.require('DST');
const DSTTreasury = artifacts.require('DSTTreasury');

contract('DSTTreasury', async (accounts) => {
  let dstTreasuryInstance;
  let dstInstance;
  const minter = accounts[0];
  const dstHolder = accounts[1];
  const dstReceiver = accounts[2];

  before(async () => {
    dstTreasuryInstance = await DSTTreasury.deployed();
    dstInstance = await DST.deployed();
    await dstTreasuryInstance.setTokenAddress(dstInstance.address, {
      from: minter
    });
  });

  it('put 1,000,000,000 DST in the first account', async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(minter);

    assert.equal(
      balance.valueOf(),
      1000000000 * 10 ** 18,
      '1,000,000,000 wasn\'t in the first account'
    );
  });

  it('0 DST in treasury', async () => {
    const balance = await dstInstance.balanceOf(dstTreasuryInstance.address);
    assert.equal(balance.valueOf(), 0, '0 wasn\'t in the treasury');
  });

  describe('deposit', () => {
    before(async () => {
      await dstInstance.transfer(dstHolder, 200, { from: minter });
    });

    it('is not allowed for non holder', async () => {
      let error = false;
      try {
        await dstTreasuryInstance.deposit(10, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for holder', async () => {
      let error = false;
      const amount = 10;
      try {
        await dstInstance.approve(dstTreasuryInstance.address, amount, { from: dstHolder });
        await dstTreasuryInstance.deposit(amount, { from: dstHolder });
      } catch (e) {
        console.error(e);
        error = true;
      }
      assert.equal(error, false);
    });

    it('increase treasury balance', async () => {
      const amount = 20;
      const prevBalance = await dstInstance.balanceOf(dstTreasuryInstance.address);

      await dstInstance.approve(dstTreasuryInstance.address, amount, { from: dstHolder });
      await dstTreasuryInstance.deposit(amount, { from: dstHolder });

      const balance = await dstInstance.balanceOf.call(dstTreasuryInstance.address);
      const _amount = new BN(amount, 10);
      const _balance = prevBalance.add(_amount);
      assert.equal(balance.toString(), _balance.toString());
    });

    it('decrease user balance', async () => {
      const amount = 20;
      const prevBalance = await dstInstance.balanceOf.call(dstHolder);

      await dstInstance.approve(dstTreasuryInstance.address, amount, { from: dstHolder });
      await dstTreasuryInstance.deposit(amount, { from: dstHolder });

      const balance = await dstInstance.balanceOf.call(dstHolder);
      const _amount = new BN(amount, 10);
      const _balance = prevBalance.sub(_amount);
      assert.equal(balance.toString(), _balance.toString());
    });

    it('fail when deposit amount is greater then user balance', async () => {
      const prevBalance = await dstInstance.balanceOf(dstHolder);
      const amount = prevBalance.toNumber() + 1;
      let error = false;
      try {
        await dstInstance.approve(dstTreasuryInstance.address, amount, { from: dstHolder });
        await dstTreasuryInstance.deposit(amount, { from: dstHolder });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });
  });

  describe('withdraw', () => {
    before(async () => {
      await dstInstance.transfer(dstHolder, 200, { from: minter });
    });

    it('is not allowed for non holder', async () => {
      let error = false;
      try {
        await dstTreasuryInstance.withdraw(dstReceiver, 10, { from: dstReceiver });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('is allowed for minter', async () => {
      let error = false;
      try {
        await dstTreasuryInstance.withdraw(dstReceiver, 10, { from: minter });
      } catch (e) {
        error = true;
      }
      assert.equal(error, false);
    });

    it('decrease treasury balance', async () => {
      const amount = 20;
      const prevBalance = await dstInstance.balanceOf.call(dstTreasuryInstance.address);

      await dstTreasuryInstance.withdraw(dstReceiver, amount, { from: minter });

      const balance = await dstInstance.balanceOf.call(dstTreasuryInstance.address);
      const _amount = new BN(amount, 10);
      const _balance = prevBalance.sub(_amount);
      assert.equal(balance.toString(), _balance.toString());
    });

    it('increase user balance', async () => {
      const amount = 20;
      const prevBalance = await dstInstance.balanceOf.call(dstReceiver);

      await dstTreasuryInstance.withdraw(dstReceiver, amount, { from: minter });

      const balance = await dstInstance.balanceOf.call(dstReceiver);
      const _amount = new BN(amount, 10);
      const _balance = prevBalance.add(_amount);
      assert.equal(balance.toString(), _balance.toString());
    });
  });
});
