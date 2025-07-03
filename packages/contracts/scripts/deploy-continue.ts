import { ethers } from "hardhat";

async function main() {
  console.log("Continuing deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Use already deployed ConditionalTokens
  const conditionalTokensAddress = "0x0416a4757062c1e61759ADDb6d68Af145919F045";
  console.log("Using existing ConditionalTokens:", conditionalTokensAddress);
  
  // Deploy PlayToken
  console.log("\nDeploying PlayToken...");
  const PlayToken = await ethers.getContractFactory("PlayToken");
  const playToken = await PlayToken.deploy();
  await playToken.waitForDeployment();
  const playTokenAddress = await playToken.getAddress();
  console.log("PlayToken deployed to:", playTokenAddress);
  
  // Deploy MarketFactory
  console.log("\nDeploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(
    playTokenAddress,
    deployer.address, // Oracle address (using deployer for testing)
    conditionalTokensAddress
  );
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory deployed to:", marketFactoryAddress);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  
  // Test PlayToken
  const airdropAmount = await playToken.getAirdropAmount();
  console.log("PlayToken airdrop amount:", ethers.formatEther(airdropAmount), "PT");
  
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
  
  // Test claiming PlayTokens
  console.log("\nTesting PlayToken claim...");
  await playToken.claim();
  const balance_PT = await playToken.balanceOf(deployer.address);
  console.log("Deployer PT balance after claim:", ethers.formatEther(balance_PT), "PT");
  
  // Output contract addresses for frontend
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("PlayToken:", playTokenAddress);
  console.log("ConditionalTokens:", conditionalTokensAddress);
  console.log("MarketFactory:", marketFactoryAddress);
  console.log("Test Market:", marketAddress);
  console.log("==========================");
  
  // Save addresses to file
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    playToken: playTokenAddress,
    conditionalTokens: conditionalTokensAddress,
    marketFactory: marketFactoryAddress,
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