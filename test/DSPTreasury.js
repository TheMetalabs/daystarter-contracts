const DSP = artifacts.require("DSP");
const DSPTreasury = artifacts.require("DSPTreasury");

contract("DSPTreasury", async (accounts) => {
  it("should put 0 DSP in the first account", async () => {
    const DSPInstance = await DSP.deployed();
    const balance = await DSPInstance.balanceOf.call(accounts[0]);

    assert.equal(balance.valueOf(), 0, "0 wasn't in the first account");
  });

  it("mint 200 DSP to the second account", async () => {
    const DSPInstance = await DSP.deployed();

    await DSPInstance.mint(accounts[1], 200, {
      from: accounts[0],
    });

    const balance = await DSPInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 200, "200 wasn't in the second account");
  });

  it("0 DSP in treasury", async () => {
    const DSPInstance = await DSP.deployed();
    const DSPTreasuryInstance = await DSPTreasury.deployed();
    const balance = await DSPInstance.balanceOf.call(
      DSPTreasuryInstance.address
    );

    await DSPTreasuryInstance.setTokenAddress(DSPInstance.address, {
      from: accounts[0],
    });

    assert.equal(balance.valueOf(), 0, "0 wasn't in the treasury");
  });

  it("deposit 50 DSP (need treasury balance 50)", async () => {
    const DSPInstance = await DSP.deployed();
    const DSPTreasuryInstance = await DSPTreasury.deployed();

    await DSPInstance.approve(DSPTreasuryInstance.address, 50, {
      from: accounts[1],
    });
    await DSPTreasuryInstance.deposit(50, {
      from: accounts[1],
    });
    const balance = await DSPInstance.balanceOf.call(
      DSPTreasuryInstance.address
    );

    assert.equal(balance.valueOf(), 50, "50 wasn't in the treasury");
  });

  it("need user balance 150 DSP", async () => {
    const DSPInstance = await DSP.deployed();
    const balance = await DSPInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 150, "150 wasn't in the user");
  });

  it("deposit 50 DSP (need treasury balance 100)", async () => {
    const DSPInstance = await DSP.deployed();
    const DSPTreasuryInstance = await DSPTreasury.deployed();

    await DSPInstance.approve(DSPTreasuryInstance.address, 50, {
      from: accounts[1],
    });
    await DSPTreasuryInstance.deposit(50, {
      from: accounts[1],
    });
    const balance = await DSPInstance.balanceOf.call(
      DSPTreasuryInstance.address
    );

    assert.equal(balance.valueOf(), 100, "100 wasn't in the treasury");
  });

  it("need user balance 100 DSP", async () => {
    const DSPInstance = await DSP.deployed();
    const balance = await DSPInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 100, "100 wasn't in the user");
  });

  it("withdraw 100 DSP (need treasury balance 0)", async () => {
    const DSPInstance = await DSP.deployed();
    const DSPTreasuryInstance = await DSPTreasury.deployed();

    await DSPTreasuryInstance.withdraw(accounts[1], 100, {
      from: accounts[0],
    });
    const balance = await DSPInstance.balanceOf.call(
      DSPTreasuryInstance.address
    );

    assert.equal(balance.valueOf(), 0, "0 wasn't in the treasury");
  });

  it("need user balance 200 DSP", async () => {
    const DSPInstance = await DSP.deployed();
    const balance = await DSPInstance.balanceOf.call(accounts[1]);

    assert.equal(balance.valueOf(), 200, "200 wasn't in the user");
  });
});
