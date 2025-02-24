const hre = require("hardhat");
const { getRegistry } = require("@nomicfoundation/hardhat-ignition/registry");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment with Hardhat Ignition...");

  const deploymentName = "AlgoDollarSystem" + Math.floor(Date.now() / 1000);
  const moduleName = "AlgoDollarSystem";
  const result = await hre.ignition.deploy(moduleName, { id: deploymentName });

  console.log("Deployment completed!");
  console.log("\nDeployed contract addresses:");
  console.log("WeiUsdOracle:", result.oracle.address);
  console.log("AlgoDollar:", result.algoDollar.address);
  console.log("Rebase:", result.rebase.address);
  
  console.log("\nDeployment Configuration:");
  console.log("Initial ETH Price (cents):", result.config.ethPrice);
  console.log("Initial ETH Deposit:", ethers.formatEther(result.config.ethDeposit), "ETH");
  console.log("Weis Per Penny:", result.config.weisPerPenny);

  // Opcionalmente, você pode armazenar os endereços em um arquivo para referência futura
  const fs = require("fs");
  fs.writeFileSync(
    "deployed-addresses.json",
    JSON.stringify({
      oracle: result.oracle.address,
      algoDollar: result.algoDollar.address,
      rebase: result.rebase.address,
      network: hre.network.name,
      deploymentId: deploymentName,
      timestamp: new Date().toISOString(),
      config: {
        ethPrice: result.config.ethPrice,
        ethDeposit: result.config.ethDeposit,
        weisPerPenny: result.config.weisPerPenny
      }
    }, null, 2)
  );
  console.log("\nAddresses and configuration saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });