const DSP = artifacts.require("DSP");

contract("DSP", async (accounts) => {
  it("0 DSP in the first account", async () => {
    const DSPInstance = await DSP.deployed();
    const balance = await DSPInstance.balanceOf.call(accounts[0]);

    assert.equal(balance.valueOf(), 0, "0 wasn't in the first account");
  });

  it("mint 100 DSP", async () => {
    const DSPInstance = await DSP.deployed();
    await DSPInstance.mint(accounts[0], 100, { from: accounts[0] });
    const balance = await DSPInstance.balanceOf.call(accounts[0]);

    assert.equal(balance.valueOf(), 100, "100 wasn't in the first account");
  });

  it("mint 100 DSP", async () => {
    const DSPInstance = await DSP.deployed();
    await DSPInstance.mint(accounts[0], 100, { from: accounts[0] });
    const balance = await DSPInstance.balanceOf.call(accounts[0]);

    assert.equal(balance.valueOf(), 200, "200 wasn't in the first account");
  });
});
