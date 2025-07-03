import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("Starting deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  // Deploy ConditionalTokens (using Gnosis implementation or mock)
  console.log("\nDeploying ConditionalTokens...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await ConditionalTokens.deploy();
  await conditionalTokens.deployed();
  console.log("ConditionalTokens deployed to:", conditionalTokens.address);
  
  // Deploy PlayToken
  console.log("\nDeploying PlayToken...");
  const PlayToken = await ethers.getContractFactory("PlayToken");
  const playToken = await PlayToken.deploy();
  await playToken.deployed();
  console.log("PlayToken deployed to:", playToken.address);
  
  // Deploy MarketFactory
  console.log("\nDeploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(
    playToken.address,
    deployer.address, // Oracle address (using deployer for testing)
    conditionalTokens.address
  );
  await marketFactory.deployed();
  console.log("MarketFactory deployed to:", marketFactory.address);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  
  // Test PlayToken
  const airdropAmount = await playToken.getAirdropAmount();
  console.log("PlayToken airdrop amount:", ethers.utils.formatEther(airdropAmount), "PT");
  
  // Test MarketFactory
  const factoryPlayToken = await marketFactory.playToken();
  const factoryOracle = await marketFactory.oracle();
  const liquidityParameter = await marketFactory.b();
  
  console.log("MarketFactory PlayToken:", factoryPlayToken);
  console.log("MarketFactory Oracle:", factoryOracle);
  console.log("MarketFactory Liquidity Parameter:", ethers.utils.formatEther(liquidityParameter), "PT");
  
  // Create a test market
  console.log("\nCreating test market...");
  const currentTime = Math.floor(Date.now() / 1000);
  const tradingDeadline = currentTime + 7 * 24 * 60 * 60; // 7 days
  const resolutionTime = tradingDeadline + 1 * 24 * 60 * 60; // 1 day after trading ends
  
  const tx = await marketFactory.createMarket(
    "Test Market: Social Security Coverage Rate",
    "Can this project improve social security coverage rate by 10%?",
    tradingDeadline,
    resolutionTime,
    3 // 3 outcomes: Yes, No, Partial
  );
  
  const receipt = await tx.wait();
  const marketCreatedEvent = receipt.events?.find(e => e.event === "MarketCreated");
  const marketAddress = marketCreatedEvent?.args?.market;
  
  console.log("Test market created at:", marketAddress);
  
  // Test claiming PlayTokens
  console.log("\nTesting PlayToken claim...");
  await playToken.claim();
  const balance_PT = await playToken.balanceOf(deployer.address);
  console.log("Deployer PT balance after claim:", ethers.utils.formatEther(balance_PT), "PT");
  
  // Output contract addresses for frontend
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", await ethers.provider.getNetwork());
  console.log("Deployer:", deployer.address);
  console.log("PlayToken:", playToken.address);
  console.log("ConditionalTokens:", conditionalTokens.address);
  console.log("MarketFactory:", marketFactory.address);
  console.log("Test Market:", marketAddress);
  console.log("==========================");
  
  // Save addresses to file
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    playToken: playToken.address,
    conditionalTokens: conditionalTokens.address,
    marketFactory: marketFactory.address,
    testMarket: marketAddress
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  
  console.log("\nDeployment completed successfully!");
  console.log("Contract addresses saved to deployed-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});