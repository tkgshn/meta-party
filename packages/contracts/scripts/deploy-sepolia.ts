import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment to Sepolia testnet...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("⚠️  Insufficient balance. Please get test ETH from Sepolia faucet: https://sepoliafaucet.com/");
  }

  // Deploy PlayToken
  console.log("\n📄 Deploying PlayToken...");
  const PlayToken = await ethers.getContractFactory("PlayToken");
  const playToken = await PlayToken.deploy();
  await playToken.waitForDeployment();
  const playTokenAddress = await playToken.getAddress();
  console.log("✅ PlayToken deployed to:", playTokenAddress);

  // Deploy ConditionalTokens
  console.log("\n📄 Deploying ConditionalTokens...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await ConditionalTokens.deploy();
  await conditionalTokens.waitForDeployment();
  const conditionalTokensAddress = await conditionalTokens.getAddress();
  console.log("✅ ConditionalTokens deployed to:", conditionalTokensAddress);

  // Deploy MarketFactory
  console.log("\n📄 Deploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(
    playTokenAddress,
    deployer.address, // Use deployer as oracle
    conditionalTokensAddress
  );
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("✅ MarketFactory deployed to:", marketFactoryAddress);

  // Prepare deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      PlayToken: playTokenAddress,
      ConditionalTokens: conditionalTokensAddress,
      MarketFactory: marketFactoryAddress
    },
    blockExplorer: `https://sepolia.etherscan.io`
  };

  // Save deployment addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentPath = path.join(deploymentsDir, "sepolia.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Also save to root for easy access
  const rootDeploymentPath = path.join(__dirname, "../deployed-addresses-sepolia.json");
  fs.writeFileSync(rootDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info also saved to:", rootDeploymentPath);

  // Print summary
  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("Network: Sepolia");
  console.log("Chain ID: 11155111");
  console.log("PlayToken:", playTokenAddress);
  console.log("ConditionalTokens:", conditionalTokensAddress);
  console.log("MarketFactory:", marketFactoryAddress);
  console.log("========================");

  console.log("\n📝 Next steps:");
  console.log("1. Update your .env file in apps/web/ with:");
  console.log(`   NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS=${playTokenAddress}`);
  console.log(`   NEXT_PUBLIC_SEPOLIA_MARKET_FACTORY_ADDRESS=${marketFactoryAddress}`);
  console.log(`   NEXT_PUBLIC_SEPOLIA_CONDITIONAL_TOKENS_ADDRESS=${conditionalTokensAddress}`);
  console.log("\n2. Update usePlayToken.ts to set contractsDeployed: true for Sepolia");
  console.log("\n3. Verify contracts on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${playTokenAddress}`);
  console.log(`   npx hardhat verify --network sepolia ${conditionalTokensAddress}`);
  console.log(`   npx hardhat verify --network sepolia ${marketFactoryAddress} ${conditionalTokensAddress} ${playTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });