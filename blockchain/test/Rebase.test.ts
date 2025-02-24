import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Rebase tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const AlgoDollar = await hre.ethers.getContractFactory("AlgoDollar");
    const algoDollar = await AlgoDollar.deploy();

    const WeiUsdOracle = await hre.ethers.getContractFactory("WeiUsdOracle");
    const oracle = await WeiUsdOracle.deploy(200000);

    const Rebase = await hre.ethers.getContractFactory("Rebase");
    const rebase = await Rebase.deploy(
      oracle.getAddress(),
      algoDollar.getAddress()
    );

    await algoDollar.setRebase(rebase.getAddress());

    const weisPerPenny = await oracle.getWeiRate();

    await rebase.initialize(weisPerPenny, { value: ethers.parseEther("1") });

    return { oracle, rebase, algoDollar, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deposit", async function () {
      const { oracle, rebase, algoDollar, otherAccount } = await loadFixture(
        deployFixture
      );

      const instance = rebase.connect(otherAccount);

      expect(await instance.deposit({ value: ethers.parseEther("1") }))
        .to.emit(instance, "Transfer")
        .withArgs(ethers.ZeroAddress, otherAccount, 200000);
    });
    1;
    it("Should withdraw ETH", async function () {
      const { oracle, rebase, algoDollar, otherAccount } = await loadFixture(
        deployFixture
      );

      const instance = rebase.connect(otherAccount);

      await instance.deposit({ value: ethers.parseEther("1") });

      expect(await instance.withdrawEth("1"))
        .to.emit(instance, "Transfer")
        .withArgs(otherAccount, ethers.ZeroAddress, 200000);
    });

    it("Should withdraw USDA", async function () {
      const { oracle, rebase, algoDollar, otherAccount } = await loadFixture(
        deployFixture
      );

      const instance = rebase.connect(otherAccount);

      await instance.deposit({ value: ethers.parseEther("1") });

      expect(await instance.withdrawUsda(200000))
        .to.emit(instance, "Transfer")
        .withArgs(otherAccount, ethers.ZeroAddress, 200000);
    });

    it("Should get parity", async function () {
      const { oracle, rebase, algoDollar, otherAccount } = await loadFixture(
        deployFixture
      );

      expect(await rebase.getParity(0)).to.equal(100);
    });

    it("Should supply down", async function () {
      const { oracle, rebase, algoDollar, otherAccount } = await loadFixture(
        deployFixture
      );

      await oracle.subscribe(rebase.getAddress());

      const instance = rebase.connect(otherAccount);

      await instance.deposit({ value: ethers.parseEther("1") });

      const oldSupplly = await algoDollar.totalSupply();
      await oracle.setEthPrice(200000 * 0.95)
      const newSupply = await algoDollar.totalSupply();


      expect(newSupply).to.equal(Number(oldSupplly) * 0.95);
      expect(await rebase.getParity(0)).to.be.within(98, 102)
    });

    it("Should adjust supply up", async function () {
      const { oracle, rebase, algoDollar, otherAccount } = await loadFixture(
        deployFixture
      );

      await oracle.subscribe(rebase.getAddress());

      const instance = rebase.connect(otherAccount);

      await instance.deposit({ value: ethers.parseEther("1") });

      const oldSupplly = await algoDollar.totalSupply();
      await oracle.setEthPrice(200000 * 1.05)
      const newSupply = await algoDollar.totalSupply();


      expect(newSupply).to.equal(Number(oldSupplly) * 1.05);
      expect(await rebase.getParity(0)).to.be.within(98, 102)
    });

  });
});
