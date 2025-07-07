import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("Starting deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy ConditionalTokens (using Gnosis implementation or mock)
  console.log("\nDeploying ConditionalTokens...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await ConditionalTokens.deploy();
  await conditionalTokens.waitForDeployment();
  console.log("ConditionalTokens deployed to:", await conditionalTokens.getAddress());
  
  // Deploy PlayToken
  console.log("\nDeploying PlayToken...");
  const PlayToken = await ethers.getContractFactory("PlayToken");
  const playToken = await PlayToken.deploy();
  await playToken.waitForDeployment();
  console.log("PlayToken deployed to:", await playToken.getAddress());
  
  // Deploy MarketFactory
  console.log("\nDeploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(
    await playToken.getAddress(),
    deployer.address, // Oracle address (using deployer for testing)
    await conditionalTokens.getAddress()
  );
  await marketFactory.waitForDeployment();
  console.log("MarketFactory deployed to:", await marketFactory.getAddress());
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  
  // Test PlayToken
  const baseAirdropAmount = await playToken.getBaseAirdropAmount();
  const volunteerBonusAmount = await playToken.getVolunteerBonusAmount();
  console.log("PlayToken base airdrop amount:", ethers.formatEther(baseAirdropAmount), "PT");
  console.log("PlayToken volunteer bonus amount:", ethers.formatEther(volunteerBonusAmount), "PT");
  
  // Test MarketFactory
  const factoryPlayToken = await marketFactory.playToken();
  const factoryOracle = await marketFactory.oracle();
  const liquidityParameter = await marketFactory.b();
  
  console.log("MarketFactory PlayToken:", factoryPlayToken);
  console.log("MarketFactory Oracle:", factoryOracle);
  console.log("MarketFactory Liquidity Parameter:", ethers.formatEther(liquidityParameter), "PT");
  
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
  const marketCreatedEvent = receipt?.logs?.find((log: any) => {
    try {
      const parsed = marketFactory.interface.parseLog(log);
      return parsed?.name === "MarketCreated";
    } catch (e) {
      return false;
    }
  });
  const marketAddress = marketCreatedEvent ? marketFactory.interface.parseLog(marketCreatedEvent).args.market : undefined;
  
  console.log("Test market created at:", marketAddress);
  
  // Test PlayToken distributor role (deployer has initial distributor role)
  console.log("\nTesting PlayToken distribution...");
  await playToken.distributeBaseAirdrop(deployer.address);
  const balance_PT = await playToken.balanceOf(deployer.address);
  console.log("Deployer PT balance after base airdrop:", ethers.formatEther(balance_PT), "PT");
  
  // Output contract addresses for frontend
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("PlayToken:", await playToken.getAddress());
  console.log("ConditionalTokens:", await conditionalTokens.getAddress());
  console.log("MarketFactory:", await marketFactory.getAddress());
  console.log("Test Market:", marketAddress);
  console.log("==========================");
  
  // Save addresses to file
  const network = await ethers.provider.getNetwork();
  const addresses = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    playToken: await playToken.getAddress(),
    conditionalTokens: await conditionalTokens.getAddress(),
    marketFactory: await marketFactory.getAddress(),
    testMarket: marketAddress
  };
  
  const fs = require('fs');
  // Save to network-specific file
  const filename = `deployed-addresses-${network.chainId}.json`;
  fs.writeFileSync(
    filename,
    JSON.stringify(addresses, null, 2)
  );
  
  // Also update the main deployed-addresses.json if it's Amoy
  if (Number(network.chainId) === 80002) {
    fs.writeFileSync(
      'deployed-addresses.json',
      JSON.stringify(addresses, null, 2)
    );
  }
  
  console.log("\nDeployment completed successfully!");
  console.log(`Contract addresses saved to ${filename}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});