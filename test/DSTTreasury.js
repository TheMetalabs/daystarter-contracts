const DST = artifacts.require("DST");
const DSTTreasury = artifacts.require("DSTTreasury");

contract("DSTTreasury", async (accounts) => {
  it("should put 1,000,000,000 DST in the first account", async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(accounts[0]);

    assert.equal(
      balance.valueOf(),
      1000000000 * 10 ** 18,
      "1,000,000,000 wasn't in the first account"
    );
  });

  it("send 1,000 DST to the second account", async () => {
    const DSTInstance = await DST.deployed();

    await DSTInstance.transfer(accounts[1], 1000, {
      from: accounts[0],
    });

    const balance = await DSTInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 1000, "1,000 wasn't in the second account");
  });

  it("0 DST in treasury", async () => {
    const DSTInstance = await DST.deployed();
    const DSTTreasuryInstance = await DSTTreasury.deployed();
    const balance = await DSTInstance.balanceOf.call(
      DSTTreasuryInstance.address
    );

    await DSTTreasuryInstance.setTokenAddress(DSTInstance.address, {
      from: accounts[0],
    });

    assert.equal(balance.valueOf(), 0, "0 wasn't in the treasury");
  });

  it("deposit 100 DST (need treasury balance 100)", async () => {
    const DSTInstance = await DST.deployed();
    const DSTTreasuryInstance = await DSTTreasury.deployed();

    await DSTInstance.approve(DSTTreasuryInstance.address, 100, {
      from: accounts[1],
    });
    await DSTTreasuryInstance.deposit(100, {
      from: accounts[1],
    });
    const balance = await DSTInstance.balanceOf.call(
      DSTTreasuryInstance.address
    );

    assert.equal(balance.valueOf(), 100, "100 wasn't in the treasury");
  });

  it("need user balance 900 DST", async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 900, "900 wasn't in the user");
  });

  it("deposit 100 DST (need treasury balance 200)", async () => {
    const DSTInstance = await DST.deployed();
    const DSTTreasuryInstance = await DSTTreasury.deployed();

    await DSTInstance.approve(DSTTreasuryInstance.address, 100, {
      from: accounts[1],
    });
    await DSTTreasuryInstance.deposit(100, {
      from: accounts[1],
    });
    const balance = await DSTInstance.balanceOf.call(
      DSTTreasuryInstance.address
    );

    assert.equal(balance.valueOf(), 200, "200 wasn't in the treasury");
  });

  it("need user balance 800 DST", async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 800, "800 wasn't in the user");
  });

  it("withdraw 100 DST (need treasury balance 100)", async () => {
    const DSTInstance = await DST.deployed();
    const DSTTreasuryInstance = await DSTTreasury.deployed();

    await DSTTreasuryInstance.withdraw(accounts[1], 100, {
      from: accounts[0],
    });
    const balance = await DSTInstance.balanceOf.call(
      DSTTreasuryInstance.address
    );

    assert.equal(balance.valueOf(), 100, "100 wasn't in the treasury");
  });

  it("need user balance 900 DST", async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 900, "900 wasn't in the user");
  });
});
