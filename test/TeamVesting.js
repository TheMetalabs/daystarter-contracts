const BigNumber = require('bignumber.js');
const moment = require('moment');
const util = require('./util');

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const Vesting = artifacts.require('Vesting');
const DST = artifacts.require('DST');
const monthInSeconds = 30 * 24 * 60 * 60;
const decimal = BigNumber('1e18');
const teamType = 1;

contract('TeamVesting', async (accounts) => {
  const owner = accounts[0];
  const teamVester = accounts[1];

  describe('Total', () => {
    const total = BigNumber('80000000').times(decimal);
    const initialRelease = BigNumber('0');
    const periodicRelease = BigNumber('2240000').times(decimal);

    let vestingInstance;
    let dstInstance;
    let started;

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(teamType, total, owner);
      const block = await web3.eth.getBlock('latest');
      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(teamType, started.unix());
    });

    it('M+0', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      let balance = await vestingInstance.getClaimableBalance(owner);

      console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(initialRelease.toString(), balance.toString());
    });

    it('Cliff: M+1 => M+11', async () => {
      for (let i = 1; i <= 11; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(owner);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(initialRelease.toString(), balance.toString());
      }
    });

    it('Periodic: M+12 => M+46', async () => {
      let release = BigNumber(initialRelease);
      for (let i = 12; i <= 46; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(owner);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        release = release.plus(periodicRelease);
        assert.equal(release.toString(), balance.toString());
      }
    });

    it('Last periodic: M+47', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(owner);

      console.log(`M+47: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.toString(), balance.toString());
    });

    it('After periodic: M+48', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(owner);

      console.log(`M+48: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.toString(), balance.toString());
    });
  });

  describe('Total with claim', () => {
    const total = BigNumber('80000000').times(decimal);
    const initialRelease = BigNumber('0');
    const periodicRelease = BigNumber('2240000').times(decimal);

    let vestingInstance;
    let dstInstance;
    let started;
    let claimed = BigNumber(0);

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(teamType, total, teamVester);
      const block = await web3.eth.getBlock('latest');
      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(teamType, started.unix());
    });

    it('M+0', async () => {
      let block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      let balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(initialRelease.toString(), balance.toString());
    });

    it('Cliff: M+1 => M+11', async () => {
      for (let i = 1; i <= 11; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(teamVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        assert.equal('0', balance.toString());
      }
    });

    it('Periodic: M+12 => M+46', async () => {
      for (let i = 12; i <= 46; i++) {
        const _prevDstBalance = await dstInstance.balanceOf(teamVester);
        const prevDstBalance = BigNumber(_prevDstBalance.toString());

        let block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));

        const balance = await vestingInstance.getClaimableBalance(teamVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(periodicRelease.toString(), balance.toString());

        await vestingInstance.claim({ from: teamVester });
        const vestingInfo = await vestingInstance.getVestingInfo(teamType);
        const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(teamVester);
        const dstBalance = await dstInstance.balanceOf(teamVester);
        claimed = claimed.plus(periodicRelease);

        block = await web3.eth.getBlock('latest');
        assert.equal(prevDstBalance.plus(periodicRelease).toString(), dstBalance.toString());
        assert.equal(vestingInfo.claimedBalance, claimed.toString());
        assert.equal(vestingAccountInfo.claimedBalance, claimed.toString());
        assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
      }
    });

    it('Last periodic: M+47', async () => {
      let block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+47: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.minus(claimed).toString(), balance.toString());

      await vestingInstance.claim({ from: teamVester });
      const vestingInfo = await vestingInstance.getVestingInfo(teamType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(teamVester);
      const dstBalance = await dstInstance.balanceOf(teamVester);
      claimed = claimed.plus(balance);

      block = await web3.eth.getBlock('latest');
      assert.equal(total.toString(), dstBalance.toString());
      assert.equal(vestingInfo.claimedBalance, total.toString());
      assert.equal(vestingAccountInfo.claimedBalance, total.toString());
      assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
    });

    it('After periodic: M+48', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+48: +${diff} days, Released: ${balance.toString()}`);
      assert.equal('0', balance.toString());

      let error = false;
      try {
        await vestingInstance.claim({ from: teamVester });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });
  });

  describe('Indivisual', () => {
    const total = BigNumber('1000').times(decimal);
    const initialRelease = BigNumber(0);
    const periodicRelease = BigNumber(total).times(0.028);

    let vestingInstance;
    let dstInstance;
    let started;

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(teamType, total, teamVester);
      const block = await web3.eth.getBlock('latest');

      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(teamType, started.unix());
    });

    it('M+0', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      let balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(initialRelease.toString(), balance.toString());
    });

    it('Cliff: M+1 => M+11', async () => {
      for (let i = 1; i <= 11; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(teamVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(initialRelease.toString(), balance.toString());
      }
    });

    it('Periodic: M+12 => M+46', async () => {
      let release = BigNumber(initialRelease);
      for (let i = 12; i <= 46; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(teamVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        release = release.plus(periodicRelease);
        assert.equal(release.toString(), balance.toString());
      }
    });

    it('Last periodic: M+47', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+47: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.toString(), balance.toString());
    });

    it('After periodic: M+48', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+48: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.toString(), balance.toString());
    });
  });

  describe('Indivisual with claim', () => {
    const total = BigNumber('1000').times(decimal);
    const initialRelease = BigNumber('0');
    const periodicRelease = BigNumber(total).times(0.028);

    let vestingInstance;
    let dstInstance;
    let started;
    let claimed = BigNumber(0);

    before(async () => {
      vestingInstance = await Vesting.new();
      dstInstance = await DST.new();
      await vestingInstance.setDSTAddress(dstInstance.address);

      await dstInstance.approve(vestingInstance.address, total);
      await vestingInstance.add(teamType, total, teamVester);
      const block = await web3.eth.getBlock('latest');
      started = moment.unix(block.timestamp + monthInSeconds - 1);
      console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
      await vestingInstance.setStartTime(teamType, started.unix());
    });

    it('M+0', async () => {
      let block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      let balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(initialRelease.toString(), balance.toString());
    });

    it('Cliff: M+1 => M+11', async () => {
      for (let i = 1; i <= 11; i++) {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(teamVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        assert.equal('0', balance.toString());
      }
    });

    it('Periodic: M+12 => M+46', async () => {
      for (let i = 12; i <= 46; i++) {
        const _prevDstBalance = await dstInstance.balanceOf(teamVester);
        const prevDstBalance = BigNumber(_prevDstBalance.toString());

        let block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));

        const balance = await vestingInstance.getClaimableBalance(teamVester);

        console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(periodicRelease.toString(), balance.toString());

        await vestingInstance.claim({ from: teamVester });
        const vestingInfo = await vestingInstance.getVestingInfo(teamType);
        const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(teamVester);
        const dstBalance = await dstInstance.balanceOf(teamVester);
        claimed = claimed.plus(periodicRelease);

        block = await web3.eth.getBlock('latest');
        assert.equal(prevDstBalance.plus(periodicRelease).toString(), dstBalance.toString());
        assert.equal(vestingInfo.claimedBalance, claimed.toString());
        assert.equal(vestingAccountInfo.claimedBalance, claimed.toString());
        assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
      }
    });

    it('Last periodic: M+47', async () => {
      let block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+47: +${diff} days, Released: ${balance.toString()}`);
      assert.equal(total.minus(claimed).toString(), balance.toString());

      await vestingInstance.claim({ from: teamVester });
      const vestingInfo = await vestingInstance.getVestingInfo(teamType);
      const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(teamVester);
      const dstBalance = await dstInstance.balanceOf(teamVester);
      claimed = claimed.plus(balance);

      block = await web3.eth.getBlock('latest');
      assert.equal(total.toString(), dstBalance.toString());
      assert.equal(vestingInfo.claimedBalance, total.toString());
      assert.equal(vestingAccountInfo.claimedBalance, total.toString());
      assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
    });

    it('After periodic: M+48', async () => {
      const block = await util.advanceTimeAndBlock(monthInSeconds);
      const current = moment.unix(block.timestamp);
      const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
      const balance = await vestingInstance.getClaimableBalance(teamVester);

      console.log(`M+48: +${diff} days, Released: ${balance.toString()}`);
      assert.equal('0', balance.toString());

      let error = false;
      try {
        await vestingInstance.claim({ from: teamVester });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });
  });
});
