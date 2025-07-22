import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy ArbitrageBot contract
  console.log("\n📦 Deploying ArbitrageBot contract...");
  
  const ArbitrageBot = await ethers.getContractFactory("ArbitrageBot");
  
  // Use deployer as initial fee recipient (can be changed later)
  const feeRecipient = deployer.address;
  
  const arbitrageBot = await ArbitrageBot.deploy(feeRecipient);
  await arbitrageBot.waitForDeployment();

  const contractAddress = await arbitrageBot.getAddress();
  console.log("✅ ArbitrageBot deployed to:", contractAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const config = await arbitrageBot.getConfig();
  console.log("Configuration:", {
    maxSlippage: config[0].toString(),
    maxGasPrice: ethers.formatUnits(config[1], "gwei") + " gwei",
    minProfitThreshold: ethers.formatEther(config[2]) + " ETH",
    feePercentage: config[3].toString(),
    feeRecipient: config[4],
  });

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId.toString(),
    },
    contracts: {
      ArbitrageBot: {
        address: contractAddress,
        deployer: deployer.address,
        deploymentBlock: await ethers.provider.getBlockNumber(),
        deploymentTime: new Date().toISOString(),
      },
    },
    configuration: {
      maxSlippage: config[0].toString(),
      maxGasPrice: config[1].toString(),
      minProfitThreshold: config[2].toString(),
      feePercentage: config[3].toString(),
      feeRecipient: config[4],
    },
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const networkDir = path.join(deploymentsDir, network.name);
  
  // Create directories if they don't exist
  try {
    const fs = require("fs");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    if (!fs.existsSync(networkDir)) {
      fs.mkdirSync(networkDir);
    }
  } catch (error) {
    console.log("Note: Could not create deployments directory");
  }

  // Save deployment info
  const deploymentPath = path.join(networkDir, "ArbitrageBot.json");
  try {
    writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to:", deploymentPath);
  } catch (error) {
    console.log("Note: Could not save deployment info to file");
    console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  }

  // Print summary
  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Gas Used: Pending confirmation...`);
  
  // Wait for a few confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await arbitrageBot.deploymentTransaction()?.wait(2);
  console.log("✅ Contract confirmed on blockchain");

  // Print next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Update your .env file with the contract address:");
  console.log(`   ${network.name.toUpperCase()}_ARBITRAGE_CONTRACT=${contractAddress}`);
  console.log("2. Verify the contract on block explorer if needed");
  console.log("3. Fund the contract with initial tokens for arbitrage");
  console.log("4. Authorize bot addresses to execute arbitrage");

  return contractAddress;
}

// Execute deployment
main()
  .then((address) => {
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`Contract Address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }); 