const PreSale = artifacts.require("PreSale");
const DST = artifacts.require("DST");

contract("PreSale", async (accounts) => {
  const owner = accounts[0];
  const preSaleSwapper = accounts[1];
  const preSale1Swapper = accounts[2];
  const preSale2Swapper = accounts[3];
  const publicSaleSwapper = accounts[4];
  const notWhiteListed = accounts[5];

  before(async () => {
    preSaleInstance = await PreSale.new();
    dstInstance = await DST.new();
    const block = await web3.eth.getBlock("latest");
    blockNumber = block.number;
  });

  describe("setPreSaleInfo", () => {
    it("incorrect parameter (price <= 0)", async () => {
      let error = false;

      try {
        await preSaleInstance.setPreSaleInfo(
          0,
          blockNumber,
          blockNumber + 100,
          blockNumber + 200
        );
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("incorrect parameter (presale1 > presale2)", async () => {
      let error = false;

      try {
        await preSaleInstance.setPreSaleInfo(
          0,
          blockNumber + 100,
          blockNumber,
          blockNumber + 200
        );
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("incorrect parameter (presale2 > public sale)", async () => {
      let error = false;

      try {
        await preSaleInstance.setPreSaleInfo(
          0,
          blockNumber,
          blockNumber + 200,
          blockNumber + 100
        );
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("correct parameter", async () => {
      let error = false;

      try {
        await preSaleInstance.setPreSaleInfo(
          1000,
          blockNumber,
          blockNumber + 100,
          blockNumber + 200
        );
      } catch (e) {
        error = true;
      }

      assert.equal(error, false);
    });

    it("check value", async () => {
      const price = await preSaleInstance.price.call();
      const preSale1Height = await preSaleInstance.preSale1Height.call();
      const preSale2Height = await preSaleInstance.preSale2Height.call();
      const publicSaleHeight = await preSaleInstance.publicSaleHeight.call();

      assert.equal(price, 1000);
      assert.equal(preSale1Height, blockNumber);
      assert.equal(preSale2Height, blockNumber + 100);
      assert.equal(publicSaleHeight, blockNumber + 200);
    });
  });

  describe("setFoundationWalletAddress", () => {
    it("incorrect parameter (not address)", async () => {
      let error = false;

      try {
        await preSaleInstance.setFoundationWalletAddress(0);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("correct parameter", async () => {
      let error = false;

      try {
        await preSaleInstance.setFoundationWalletAddress(owner);
      } catch (e) {
        error = true;
      }

      assert.equal(error, false);
    });

    it("check value", async () => {
      const foundationWallet = await preSaleInstance.foundationWallet.call();
      assert.equal(foundationWallet, owner);
    });
  });

  describe("addPreSaleAccounts", () => {
    it("incorrect parameter (different length)", async () => {
      let error = false;

      try {
        await preSaleInstance.addPreSaleAccounts([preSaleSwapper], []);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("correct parameter", async () => {
      let error = false;

      await preSaleInstance.addPreSaleAccounts([preSaleSwapper], [100]);

      assert.equal(error, false);
    });

    it("check value", async () => {
      const accounts = await preSaleInstance.preSaleAccounts.call(
        preSaleSwapper
      );

      assert.equal(accounts.totalClaimBalance.valueOf(), 100);
      assert.equal(accounts.claimedBalance.valueOf(), 0);
      assert.equal(accounts.isExist.valueOf(), true);
    });
  });

  describe("setPreSaleAccount", () => {
    it("incorrect parameter (not registered account)", async () => {
      let error = false;

      try {
        await preSaleInstance.setPreSaleAccount(owner, 0, false);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("correct parameter", async () => {
      let error = false;

      try {
        await preSaleInstance.setPreSaleAccount(preSaleSwapper, 1000, true);
      } catch (e) {
        error = true;
      }

      assert.equal(error, false);
    });

    it("check value", async () => {
      const accounts = await preSaleInstance.preSaleAccounts.call(
        preSaleSwapper
      );

      assert.equal(accounts.totalClaimBalance.valueOf(), 1000);
      assert.equal(accounts.claimedBalance.valueOf(), 0);
      assert.equal(accounts.isExist.valueOf(), true);
    });
  });

  describe("getEthBalance", () => {
    it("balance = 0", async () => {
      const balance = await preSaleInstance.getEthBalance.call();

      assert.equal(balance, 0);
    });

    it("balance = 100", async () => {
      await web3.eth.sendTransaction({
        from: owner,
        to: preSaleInstance.address,
        value: 100,
      });

      const balance = await preSaleInstance.getEthBalance.call();

      assert.equal(balance, 100);
    });
  });

  describe("withdrawETH", () => {
    it("balance = 0", async () => {
      const originalBalance = await preSaleInstance.getEthBalance.call();
      await preSaleInstance.withdrawETH();
      const balance = await preSaleInstance.getEthBalance.call();

      assert.equal(originalBalance, 100);
      assert.equal(balance, 0);
    });
  });

  describe("setDSTAddress", () => {
    it("incorrect parameter (not address)", async () => {
      let error = false;

      try {
        await preSaleInstance.setDSTAddress(0);
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("correct parameter", async () => {
      let error = false;

      try {
        await preSaleInstance.setDSTAddress(dstInstance.address);
      } catch (e) {
        error = true;
      }

      assert.equal(error, false);
    });

    it("check value", async () => {
      const DSTAddress = await preSaleInstance.DSTAddress.call();
      assert.equal(DSTAddress, dstInstance.address);
    });
  });

  describe("getDSTBalance", () => {
    it("balance = 0", async () => {
      const balance = await preSaleInstance.getDSTBalance.call();

      assert.equal(balance, 0);
    });

    it("balance = 100", async () => {
      await dstInstance.transfer(preSaleInstance.address, 100, {
        from: owner,
      });
      const balance = await preSaleInstance.getDSTBalance.call();

      assert.equal(balance, 100);
    });
  });

  describe("withdrawDST", () => {
    it("balance = 0", async () => {
      const originalBalance = await preSaleInstance.getDSTBalance.call();
      await preSaleInstance.withdrawDST();
      const balance = await preSaleInstance.getDSTBalance.call();

      assert.equal(originalBalance, 100);
      assert.equal(balance, 0);
    });
  });

  describe("swap - presale 1", () => {
    before(async () => {
      await dstInstance.transfer(preSaleInstance.address, 100, {
        from: owner,
      });

      await preSaleInstance.addPreSaleAccounts([preSale1Swapper], [100]);
    });

    it("error - not yet", async () => {
      await preSaleInstance.setPreSaleInfo(
        1,
        blockNumber + 10000,
        blockNumber + 20000,
        blockNumber + 30000
      );

      let error = false;

      try {
        await preSaleInstance.swap({ from: preSale1Swapper, value: 100 });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("error - not whitelisted", async () => {
      await preSaleInstance.setPreSaleInfo(
        1,
        blockNumber,
        blockNumber + 20000,
        blockNumber + 30000
      );

      let error = false;

      try {
        await preSaleInstance.swap({ from: notWhiteListed, value: 100 });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("error - too much quantity", async () => {
      let error = false;

      try {
        await preSaleInstance.swap({ from: preSale1Swapper, value: 1000 });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("success", async () => {
      await preSaleInstance.swap({ from: preSale1Swapper, value: 100 });

      const accounts = await preSaleInstance.preSaleAccounts.call(
        preSale1Swapper
      );

      const balance = await dstInstance.balanceOf.call(preSale1Swapper);
      const contractBalance = await preSaleInstance.getDSTBalance.call();

      assert.equal(accounts.claimedBalance.valueOf(), 100);
      assert.equal(balance.valueOf(), 100);
      assert.equal(contractBalance, 0);
    });
  });

  describe("swap - presale 2", () => {
    before(async () => {
      await dstInstance.transfer(preSaleInstance.address, 100, {
        from: owner,
      });

      await preSaleInstance.addPreSaleAccounts([preSale2Swapper], [10]);

      await preSaleInstance.setPreSaleInfo(
        1,
        blockNumber - 1000,
        blockNumber,
        blockNumber + 1000
      );
    });

    it("error - not whitelisted", async () => {
      let error = false;

      try {
        await preSaleInstance.swap({ from: notWhiteListed, value: 100 });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("error - too much quantity", async () => {
      let error = false;

      try {
        await preSaleInstance.swap({ from: preSale2Swapper, value: 1000 });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("success", async () => {
      await preSaleInstance.swap({ from: preSale2Swapper, value: 100 });

      const accounts = await preSaleInstance.preSaleAccounts.call(
        preSale2Swapper
      );

      const balance = await dstInstance.balanceOf.call(preSale2Swapper);
      const contractBalance = await preSaleInstance.getDSTBalance.call();

      assert.equal(accounts.claimedBalance.valueOf(), 100);
      assert.equal(balance.valueOf(), 100);
      assert.equal(contractBalance, 0);
    });
  });

  describe("swap - public sale", () => {
    before(async () => {
      await dstInstance.transfer(preSaleInstance.address, 100, {
        from: owner,
      });

      await preSaleInstance.setPreSaleInfo(
        1,
        blockNumber - 1000,
        blockNumber - 500,
        blockNumber
      );
    });

    it("error - too much quantity", async () => {
      let error = false;

      try {
        await preSaleInstance.swap({ from: publicSaleSwapper, value: 1000 });
      } catch (e) {
        error = true;
      }

      assert.equal(error, true);
    });

    it("success", async () => {
      await preSaleInstance.swap({ from: publicSaleSwapper, value: 100 });

      const balance = await dstInstance.balanceOf.call(publicSaleSwapper);
      const contractBalance = await preSaleInstance.getDSTBalance.call();

      assert.equal(balance.valueOf(), 100);
      assert.equal(contractBalance, 0);
    });
  });
});
