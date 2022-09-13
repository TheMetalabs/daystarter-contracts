const BigNumber = require('bignumber.js');
const moment = require('moment');
const util = require('./util');

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const Vesting = artifacts.require('Vesting');
const DST = artifacts.require('DST');
const monthInSeconds = 30 * 24 * 60 * 60;
const decimal = BigNumber('1e18');
const marketingType = 2;

contract('MarketingVesting', async (accounts) => {
  const owner = accounts[0];
  const marketingVester = accounts[1];

  describe('Total', () => {
    const total = BigNumber('55000000').times(decimal);
    const periodicRelease = BigNumber(total).times(0.1);

    let vestingInstance;
    let dstInstance;
    let started;

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(marketingType, total, owner);
      const block = await web3.eth.getBlock('latest');
      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(marketingType, started.unix());
    });

    it('Periodic: Every 4 months M+0 => M+36', async () => {
      let release = BigNumber(0);

      for (let i = 0; i <= 36; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(owner);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        if (i % 4 === 0) {
          release = release.plus(periodicRelease);
        }
        assert.equal(release.toString(), balance.toString());
      }
    });

    it('After periodic: M+37', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(owner);

      console.log(`M+37: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.toString(), balance.toString());
    });
  });

  describe('Total with claim', () => {
    const total = BigNumber('55000000').times(decimal);
    const periodicRelease = BigNumber(total).times(0.1);

    let vestingInstance;
    let dstInstance;
    let started;
    let claimed = BigNumber(0);

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(marketingType, total, marketingVester);
      const block = await web3.eth.getBlock('latest');
      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(marketingType, started.unix());
    });

    it('Periodic: Every 4 months M+0 => M+36', async () => {
      for (let i = 0; i <= 36; i++) {
        const _prevDstBalance = await dstInstance.balanceOf(marketingVester);
        const prevDstBalance = BigNumber(_prevDstBalance.toString());

        let block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));

        const balance = await vestingInstance.getClaimableBalance(marketingVester);
        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        if (i % 4 === 0) {
          assert.equal(periodicRelease.toString(), balance.toString());
        } else {
          assert.equal('0', balance.toString());
        }

        if (i % 4 === 0) {
          await vestingInstance.claim({ from: marketingVester });
          const vestingInfo = await vestingInstance.getVestingInfo(marketingType);
          const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(marketingVester);
          const dstBalance = await dstInstance.balanceOf(marketingVester);
          claimed = claimed.plus(periodicRelease);

          block = await web3.eth.getBlock('latest');
          assert.equal(prevDstBalance.plus(periodicRelease).toString(), dstBalance.toString());
          assert.equal(vestingInfo.claimedBalance, claimed.toString());
          assert.equal(vestingAccountInfo.claimedBalance, claimed.toString());
          assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
        }
      }
    });

    it('After periodic: M+37', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(marketingVester);

      console.log(`M+37: +${diff} days, Released: ${balance.toString()}`);
      assert.equal('0', balance.toString());

      let error = false;
      try {
        await vestingInstance.claim({ from: marketingVester });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });
  });

  describe('Indivisual', () => {
    const total = BigNumber('1000').times(decimal);
    const periodicRelease = BigNumber(total).times(0.1);

    let vestingInstance;
    let dstInstance;
    let started;

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(marketingType, total, marketingVester);
      const block = await web3.eth.getBlock('latest');

      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(marketingType, started.unix());
    });

    it('Periodic: Every 4 months M+0 => M+36', async () => {
      let release = BigNumber(0);

      for (let i = 0; i <= 36; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(marketingVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        if (i % 4 === 0) {
          release = release.plus(periodicRelease);
        }
        assert.equal(release.toString(), balance.toString());
      }
    });

    it('After periodic: M+37', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(marketingVester);

      console.log(`M+37: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.toString(), balance.toString());
    });
  });

  describe('Indivisual with claim', () => {
    const total = BigNumber('1000').times(decimal);
    const periodicRelease = BigNumber(total).times(0.01);

    let vestingInstance;
    let dstInstance;
    let started;
    let claimed = BigNumber(0);

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(marketingType, total, marketingVester);
      const block = await web3.eth.getBlock('latest');
      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(marketingType, started.unix());
    });

    it('Periodic: Every 4 months M+0 => M+36', async () => {
      for (let i = 0; i <= 36; i++) {
        const _prevDstBalance = await dstInstance.balanceOf(marketingVester);
        const prevDstBalance = BigNumber(_prevDstBalance.toString());

        let block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));

        const balance = await vestingInstance.getClaimableBalance(marketingVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        if (i % 4 === 0) {
          assert.equal(periodicRelease.toString(), balance.toString());
        } else {
          assert.equal('0', balance.toString());
        }

        if (i % 4 === 0) {
          await vestingInstance.claim({ from: marketingVester });
          const vestingInfo = await vestingInstance.getVestingInfo(marketingType);
          const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(marketingVester);
          const dstBalance = await dstInstance.balanceOf(marketingVester);
          claimed = claimed.plus(periodicRelease);

          block = await web3.eth.getBlock('latest');
          assert.equal(prevDstBalance.plus(periodicRelease).toString(), dstBalance.toString());
          assert.equal(vestingInfo.claimedBalance, claimed.toString());
          assert.equal(vestingAccountInfo.claimedBalance, claimed.toString());
          assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
        }
      }
    });

    it('After periodic: M+37', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(marketingVester);

      console.log(`M+37: +${diff} days, Released: ${balance.toString()}`);
      assert.equal('0', balance.toString());

      let error = false;
      try {
        await vestingInstance.claim({ from: marketingVester });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });
  });
});
