const DST = artifacts.require("DST");

contract("DST", async (accounts) => {
  it("should put 1,000,000,000 OYLToken in the first account", async () => {
    const DSTInstance = await DST.deployed();
    const balance = await DSTInstance.balanceOf.call(accounts[0]);

    assert.equal(
      balance.valueOf(),
      1000000000 * 10 ** 18,
      "1,000,000,000 wasn't in the first account"
    );
  });
});
