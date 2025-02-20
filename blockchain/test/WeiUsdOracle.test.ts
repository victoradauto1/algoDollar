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

    const WeiUsdOracle = await hre.ethers.getContractFactory("WeiUsdOracle");
    const oracle = await WeiUsdOracle.deploy();

    return { oracle , owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const {oracle , owner, otherAccount } = await loadFixture(deployFixture);

      expect(1).to.equal(1);
    });

  });
});
