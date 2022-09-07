const BigNumber = require('bignumber.js');
const moment = require('moment');
const util = require('./util');

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const Vesting = artifacts.require("Vesting");
const DST = artifacts.require("DST");
const monthInSeconds = 30 * 24 * 60 * 60;
const decimal = BigNumber('1e18');
const privateSaleType = 0;

contract("PrivateSaleVesting", async (accounts) => {
  const owner = accounts[0];
  const privateSaleVester = accounts[1];

  describe("Private Sale Vesting", () => {
    describe("Total", () => {
      const total = BigNumber('165000000').times(decimal);
      const initialRelease = BigNumber('8250000').times(decimal);
      const periodicRelease = BigNumber('6600000').times(decimal);

      let vestingInstance;
      let dstInstance;
      let started;

      before(async () => {
        vestingInstance = await Vesting.new();
        dstInstance = await DST.new();
        await vestingInstance.setDSTAddress(dstInstance.address);

        await dstInstance.approve(vestingInstance.address, total);
        await vestingInstance.add(privateSaleType, total, owner);
        const block = await web3.eth.getBlock('latest');
        started = moment.unix(block.timestamp + monthInSeconds - 1);
        console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
        await vestingInstance.setStartTime(privateSaleType, started.unix());
      });

      it('M+0', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        let balance = await vestingInstance.getClaimableBalance(owner);

        console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(initialRelease.toString(), balance.toString());
      });

      it('Cliff: M+1 => M+5', async () => {
        for (let i = 1; i <= 5; i++) {
          const block = await util.advanceTimeAndBlock(monthInSeconds);
          const current = moment.unix(block.timestamp);
          const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
          const balance = await vestingInstance.getClaimableBalance(owner);

          console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
          assert.equal(initialRelease.toString(), balance.toString());
        }
      });

      it('Periodic: M+6 => M+28', async () => {
        let release = BigNumber(initialRelease);
        for (let i = 6; i <= 28; i++) {
          const block = await util.advanceTimeAndBlock(monthInSeconds);
          const current = moment.unix(block.timestamp);
          const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
          const balance = await vestingInstance.getClaimableBalance(owner);

          console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
          release = release.plus(periodicRelease);
          assert.equal(release.toString(), balance.toString());
        }
      });

      it('Last periodic: M+29', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(owner);

        console.log(`M+29: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(total.toString(), balance.toString());
      });

      it('After periodic: M+30', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(owner);

        console.log(`M+30: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(total.toString(), balance.toString());
      });
    });

    describe("Total with claim", () => {
      const total = BigNumber('165000000').times(decimal);
      const initialRelease = BigNumber('8250000').times(decimal);
      const periodicRelease = BigNumber('6600000').times(decimal);

      let vestingInstance;
      let dstInstance;
      let started;
      let claimed = BigNumber(0);

      before(async () => {
        vestingInstance = await Vesting.new();
        dstInstance = await DST.new();
        await vestingInstance.setDSTAddress(dstInstance.address);

        await dstInstance.approve(vestingInstance.address, total);
        await vestingInstance.add(privateSaleType, total, privateSaleVester);
        const block = await web3.eth.getBlock('latest');
        started = moment.unix(block.timestamp + monthInSeconds - 1);
        console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
        await vestingInstance.setStartTime(privateSaleType, started.unix());
      });

      it('M+0', async () => {
        let block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        let balance = await vestingInstance.getClaimableBalance(privateSaleVester);

        console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(initialRelease.toString(), balance.toString());

        await vestingInstance.claim({ from: privateSaleVester });
        const vestingInfo = await vestingInstance.getVestingInfo(privateSaleType);
        const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVester);
        const dstBalance = await dstInstance.balanceOf(privateSaleVester);
        claimed = claimed.plus(initialRelease);

        block = await web3.eth.getBlock('latest');
        assert.equal(initialRelease.toString(), dstBalance.toString());
        assert.equal(vestingInfo.claimedBalance, initialRelease.toString());
        assert.equal(vestingAccountInfo.claimedBalance, initialRelease.toString());
        assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
      });

      it('Cliff: M+1 => M+5', async () => {
        for (let i = 1; i <= 5; i++) {
          const block = await util.advanceTimeAndBlock(monthInSeconds);
          const current = moment.unix(block.timestamp);
          const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
          const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

          console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
          assert.equal('0', balance.toString());
        }
      });

      it('Periodic: M+6 => M+28', async () => {
        for (let i = 6; i <= 28; i++) {
          const _prevDstBalance = await dstInstance.balanceOf(privateSaleVester);
          const prevDstBalance = BigNumber(_prevDstBalance.toString());

          let block = await util.advanceTimeAndBlock(monthInSeconds);
          const current = moment.unix(block.timestamp);
          const diff = Math.floor(moment.duration(current.diff(started)).as('days'));

          const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

          console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
          assert.equal(periodicRelease.toString(), balance.toString());

          await vestingInstance.claim({ from: privateSaleVester });
          const vestingInfo = await vestingInstance.getVestingInfo(privateSaleType);
          const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVester);
          const dstBalance = await dstInstance.balanceOf(privateSaleVester);
          claimed = claimed.plus(periodicRelease);

          block = await web3.eth.getBlock('latest');
          assert.equal(prevDstBalance.plus(periodicRelease).toString(), dstBalance.toString());
          assert.equal(vestingInfo.claimedBalance, claimed.toString());
          assert.equal(vestingAccountInfo.claimedBalance, claimed.toString());
          assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
        }
      });

      it('Last periodic: M+29', async () => {
        let block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

        console.log(`M+29: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(total.minus(claimed).toString(), balance.toString());

        await vestingInstance.claim({ from: privateSaleVester });
        const vestingInfo = await vestingInstance.getVestingInfo(privateSaleType);
        const vestingAccountInfo = await vestingInstance.getVestingAccountInfo(privateSaleVester);
        const dstBalance = await dstInstance.balanceOf(privateSaleVester);
        claimed = claimed.plus(balance);

        block = await web3.eth.getBlock('latest');
        assert.equal(total.toString(), dstBalance.toString());
        assert.equal(vestingInfo.claimedBalance, total.toString());
        assert.equal(vestingAccountInfo.claimedBalance, total.toString());
        assert.equal(vestingAccountInfo.lastClaimedTime, block.timestamp);
      });

      it('After periodic: M+30', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

        console.log(`M+30: +${diff} days, Released: ${balance.toString()}`);
        assert.equal('0', balance.toString());

        let error = false;
        try {
          await vestingInstance.claim({ from: privateSaleVester });
        } catch (e) {
          error = true;
        }

        assert.equal(error, true);
      });
    });

    describe('Indivisual', () => {
      const total = BigNumber('1000').times(decimal);
      const initialRelease = BigNumber(total).times(0.05);
      const periodicRelease = BigNumber(total).times(0.04);

      let vestingInstance;
      let dstInstance;
      let started;

      before(async () => {
        vestingInstance = await Vesting.new();
        dstInstance = await DST.new();
        await vestingInstance.setDSTAddress(dstInstance.address);

        await dstInstance.approve(vestingInstance.address, total);
        await vestingInstance.add(privateSaleType, total, privateSaleVester);
        const block = await web3.eth.getBlock('latest');

        started = moment.unix(block.timestamp + monthInSeconds - 1);
        console.log(`Started: ${started.format('YYYY-MM-DD HH:mm:ss')}`);
        await vestingInstance.setStartTime(privateSaleType, started.unix());
      });

      it('M+0', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        let balance = await vestingInstance.getClaimableBalance(privateSaleVester);

        console.log(`M+0: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(initialRelease.toString(), balance.toString());
      });

      it('Cliff: M+1 => M+5', async () => {
        for (let i = 1; i <= 5; i++) {
          const block = await util.advanceTimeAndBlock(monthInSeconds);
          const current = moment.unix(block.timestamp);
          const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
          const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

          console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
          assert.equal(initialRelease.toString(), balance.toString());
        }
      });

      it('Periodic: M+6 => M+28', async () => {
        let release = BigNumber(initialRelease);
        for (let i = 6; i <= 28; i++) {
          const block = await util.advanceTimeAndBlock(monthInSeconds);
          const current = moment.unix(block.timestamp);
          const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
          const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

          console.log(`M+${i}: +${diff} days, Released: ${balance.toString()}`);
          release = release.plus(periodicRelease);
          assert.equal(release.toString(), balance.toString());
        }
      });

      it('Last periodic: M+29', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

        console.log(`M+29: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(total.toString(), balance.toString());
      });

      it('After periodic: M+30', async () => {
        const block = await util.advanceTimeAndBlock(monthInSeconds);
        const current = moment.unix(block.timestamp);
        const diff = Math.floor(moment.duration(current.diff(started)).as('days'));
        const balance = await vestingInstance.getClaimableBalance(privateSaleVester);

        console.log(`M+30: +${diff} days, Released: ${balance.toString()}`);
        assert.equal(total.toString(), balance.toString());
      });
    });
  });
});
