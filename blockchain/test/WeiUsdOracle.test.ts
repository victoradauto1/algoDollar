import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Wei Usd Oracle tests", function () {
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
    const rebase = await Rebase.deploy(oracle.getAddress(),algoDollar.getAddress());

    await algoDollar.setRebase(rebase.getAddress());

    return { oracle, rebase, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should get wei Rate", async function () {
      const { oracle, owner, otherAccount } = await loadFixture(deployFixture);

      expect(await oracle.getWeiRate()).to.equal("5000000000000");
    });

    it("Should set the ETH price", async function () {
      const { oracle, owner, otherAccount } = await loadFixture(deployFixture);

      await oracle.setEthPrice(400000);
      expect(await oracle.getWeiRate()).to.equal("2500000000000");
    });

    it("Should subscribe", async function () {
      const { oracle, owner, rebase, otherAccount } = await loadFixture(
        deployFixture
      );

      await expect(oracle.subscribe(rebase.target)).to.emit(oracle, "Subscribed").withArgs(rebase.target);
    });

    
    it("Should subscribe", async function () {
      const { oracle, owner, rebase, otherAccount } = await loadFixture(
        deployFixture
      );

      oracle.subscribe(rebase.target);

      await expect(oracle.unsbscribe(rebase.target)).to.emit(oracle, "Unsubscribed").withArgs(rebase.target);
    });

    it("Should update all", async function () {
      const { oracle, owner, rebase, otherAccount } = await loadFixture(
        deployFixture
      );

      oracle.subscribe(rebase.target);

      await expect(oracle.setEthPrice(400000)).to.emit(oracle, "AllUpdated").withArgs([rebase.target]);
    });
  });
});
