const BigNumber = require('bignumber.js');
const moment = require('moment');
const util = require('./util');

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const Vesting = artifacts.require('Vesting');
const DST = artifacts.require('DST');
const dayinSeconds = 24 * 60 * 60;
const monthInSeconds = 30 * dayinSeconds;
const decimal = BigNumber('1e18');
const privateSaleVestingType = 0;
const teamVestingType = 1;

contract('Vesting', async (accounts) => {
  const owner = accounts[0];
  const privateSaleVestingUser = accounts[1];
  const teamVestingUser = accounts[2];
  const nonVestingUser = accounts[3];

  let vestingInstance;
  let dstInstance;

  before(async () => {
    dstInstance = await DST.new();
    vestingInstance = await Vesting.new();
  });

  describe('setDSTAddress', () => {
    it('raise error when given address is not ERC20', async () => {
      let error = false;
      try {
        await vestingInstance.setDSTAddress(vestingInstance.address);
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('set dstAddress to given address', async () => {
      let error = false;
      try {
        await vestingInstance.setDSTAddress(dstInstance.address);
      } catch (e) {
        error = true;
      }
      const dstAddress = await vestingInstance.dstAddress.call();
      assert.equal(dstAddress, dstInstance.address);
      assert.equal(error, false);
    });
  });

  describe('setStartTime', () => {
    it('raise error when given time is past', async () => {
      let error = false;

      const block = await web3.eth.getBlock('latest');
      const timestamp = block.timestamp - 1000;
      try {
        await vestingInstance.setStartTime(privateSaleVestingType, timestamp);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it('raise error when given vesting type is not supported', async () => {
      let error = false;

      const block = await web3.eth.getBlock('latest');
      const vestingType = 5;
      const timestamp = block.timestamp + monthInSeconds;
      try {
        await vestingInstance.setStartTime(vestingType, timestamp);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it('set start time of private sale vesting propely', async () => {
      const block = await web3.eth.getBlock('latest');
      const timestamp = block.timestamp + monthInSeconds;
      await vestingInstance.setStartTime(privateSaleVestingType, timestamp);

      const vestingInfo = await vestingInstance.getVestingInfo(privateSaleVestingType);
      assert.equal(vestingInfo.startTime, timestamp);
    });

    it('set start time of team vesting propely', async () => {
      const block = await web3.eth.getBlock('latest');
      const timestamp = block.timestamp + monthInSeconds;
      await vestingInstance.setStartTime(teamVestingType, timestamp);

      const vestingInfo = await vestingInstance.getVestingInfo(teamVestingType);
      assert.equal(vestingInfo.startTime, timestamp);
    });

    it('set start time of marketing vesting propely', async () => {
      const block = await web3.eth.getBlock('latest');
      const marketingVestingType = 2;
      const timestamp = block.timestamp + monthInSeconds;
      await vestingInstance.setStartTime(marketingVestingType, timestamp);

      const vestingInfo = await vestingInstance.getVestingInfo(marketingVestingType);
      assert.equal(vestingInfo.startTime, timestamp);
    });

    it('set start time of treasury vesting propely', async () => {
      const block = await web3.eth.getBlock('latest');
      const treasuryVestingType = 3;
      const timestamp = block.timestamp + monthInSeconds;
      await vestingInstance.setStartTime(treasuryVestingType, timestamp);

      const vestingInfo = await vestingInstance.getVestingInfo(treasuryVestingType);
      assert.equal(vestingInfo.startTime, timestamp);
    });

    it('raise error when trying to update start time', async () => {
      let error = false;

      const block = await web3.eth.getBlock('latest');
      const vestingType = 0;
      const timestamp = block.timestamp + monthInSeconds;

      try {
        await vestingInstance.setStartTime(vestingType, timestamp);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });
  });

  describe('add', async () => {
    const total = BigNumber('165000000').times(decimal);

    before(async () => {
      vestingInstance = await Vesting.new();
    });

    it('raise error when DST address is not setted', async () => {
      let error = false;

      const vestingType = 0;
      const added = 1000;
      await dstInstance.approve(vestingInstance.address, added);
      try {
        await vestingInstance.add(vestingType, added, owner);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it('raise error when given vesting type is not supported', async () => {
      await vestingInstance.setDSTAddress(dstInstance.address);

      let error = false;
      const vestingType = 5;
      const added = 1000;
      await dstInstance.approve(vestingInstance.address, added);
      try {
        await vestingInstance.add(vestingType, added, owner);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it('add vesting propely', async () => {
      let error = false;
      const vestingType = 0;
      const added = 1000;
      await dstInstance.approve(vestingInstance.address, added);
      try {
        await vestingInstance.add(vestingType, added, owner);
      } catch (e) {
        console.error(e);
        error = true;
      }
      assert.equal(error, false);

      const block = await web3.eth.getBlock('latest');
      const vestingInfo = await vestingInstance.getVestingInfo(vestingType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(owner);
      assert.equal(vestingInfo.addedBalance, added);
      assert.equal(vestingAccountInfo.totalBalance, added);
      assert.equal(vestingAccountInfo.createdTime, block.timestamp);
    });

    it('raise error when total balance is over', async () => {
      let error = false;
      const vestingType = 0;
      await dstInstance.approve(vestingInstance.address, total);
      try {
        await vestingInstance.add(vestingType, total, privateSaleVestingUser);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it('raise error when address has vesting', async () => {
      let error = false;
      const vestingType = 0;
      const added = 1000;
      await dstInstance.approve(vestingInstance.address, added);
      try {
        await vestingInstance.add(vestingType, added, owner);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it('add vesting propely when balance is not over total balance', async () => {
      let error = false;
      const vestingType = 0;
      let vestingInfo = await vestingInstance.getVestingInfo(vestingType);
      const prevAdded = vestingInfo.addedBalance;
      const added = total.minus(prevAdded);
      await dstInstance.approve(vestingInstance.address, added);
      try {
        await vestingInstance.add(vestingType, added, privateSaleVestingUser);
      } catch (e) {
        console.error(e);
        error = true;
      }
      assert.equal(error, false);

      const block = await web3.eth.getBlock('latest');
      vestingInfo = await vestingInstance.getVestingInfo(vestingType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVestingUser);
      assert.equal(vestingInfo.addedBalance, added.plus(prevAdded).toString());
      assert.equal(vestingAccountInfo.totalBalance, added.toString());
      assert.equal(vestingAccountInfo.createdTime, block.timestamp);
    });
  });

  describe('claim', async () => {
    const amount = 10000;

    before(async () => {
      vestingInstance = await Vesting.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, amount);
      await vestingInstance.add(privateSaleVestingType, amount, privateSaleVestingUser);

      await dstInstance.approve(vestingInstance.address, amount);
      await vestingInstance.add(teamVestingType, amount, teamVestingUser);
    });

    it('raise error when caller does not have vesting', async () => {
      let error = false;
      try {
        await vestingInstance.claim({ from: nonVestingUser });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('raise error when start time is not setted', async () => {
      let error = false;
      try {
        await vestingInstance.claim({ from: privateSaleVestingUser });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);
    });

    it('transfer release balance to vesting user', async () => {
      const block = await web3.eth.getBlock('latest');
      const timestamp = block.timestamp + 1000;
      await vestingInstance.setStartTime(privateSaleVestingType, timestamp);
      await util.advanceTimeAndBlock(1000);
      await vestingInstance.claim({ from: privateSaleVestingUser });

      const claimed = BigNumber(amount).times(0.05);
      const vestingInfo = await vestingInstance.getVestingInfo(privateSaleVestingType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVestingUser);
      const dstBalance = await dstInstance.balanceOf(privateSaleVestingUser);
      assert.equal(vestingInfo.claimedBalance, claimed.toString());
      assert.equal(vestingAccountInfo.claimedBalance, claimed.toString());
      assert.equal(dstBalance.toString(), claimed.toString());
    });

    it('raise error when claimable balance is 0', async () => {
      const block = await web3.eth.getBlock('latest');
      const timestamp = block.timestamp + 1000;
      await vestingInstance.setStartTime(teamVestingType, timestamp);
      await util.advanceTimeAndBlock(1000);

      let error = false;
      try {
        await vestingInstance.claim({ from: teamVestingUser });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      const vestingInfo = await vestingInstance.getVestingInfo(teamVestingType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(teamVestingUser);
      assert.equal(vestingInfo.claimedBalance, '0');
      assert.equal(vestingAccountInfo.claimedBalance, '0');
    });

    it('raise error when user has 0 balance after claim', async () => {
      await util.advanceTimeAndBlock(dayinSeconds);
      const prevVestingInfo = await vestingInstance.getVestingInfo(privateSaleVestingType);
      const prevVestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVestingUser);
      const prevDstBalance = await dstInstance.balanceOf(privateSaleVestingUser);

      let error = false;
      try {
        await vestingInstance.claim({ from: privateSaleVestingUser });
      } catch (e) {
        error = true;
      }
      assert.equal(error, true);

      await util.advanceTimeAndBlock(monthInSeconds * 6);
      await vestingInstance.claim({ from: privateSaleVestingUser });

      const claimed = BigNumber(amount).times(0.04);
      const vestingInfo = await vestingInstance.getVestingInfo(privateSaleVestingType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVestingUser);
      const dstBalance = await dstInstance.balanceOf(privateSaleVestingUser);

      assert.equal(vestingInfo.claimedBalance, claimed.plus(prevVestingInfo.claimedBalance).toString());
      assert.equal(vestingAccountInfo.claimedBalance, claimed.plus(prevVestingAccountInfo.claimedBalance).toString());
      assert.equal(dstBalance.toString(), claimed.plus(prevDstBalance).toString());
    });
  });
});
