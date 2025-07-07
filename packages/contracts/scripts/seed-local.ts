import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Starting local data seeding for Anvil...");
  
  // Get signers
  const [deployer, alice, bob, charlie, david, eve] = await ethers.getSigners();
  
  // Load deployed addresses
  const network = await ethers.provider.getNetwork();
  const addressFile = `deployed-addresses-${network.chainId}.json`;
  
  if (!fs.existsSync(addressFile)) {
    console.error(`Deployed addresses file not found: ${addressFile}`);
    console.error("Please run 'npm run deploy:local' first");
    process.exit(1);
  }
  
  const addresses = JSON.parse(fs.readFileSync(addressFile, 'utf8'));
  console.log("Loaded addresses from:", addressFile);
  
  // Connect to contracts
  const playToken = await ethers.getContractAt("PlayToken", addresses.playToken);
  const marketFactory = await ethers.getContractAt("MarketFactory", addresses.marketFactory);
  
  console.log("\n=== Distributing PlayTokens ===");
  
  // Have all test accounts claim their PlayTokens
  const testAccounts = [
    { signer: alice, name: "Alice" },
    { signer: bob, name: "Bob" },
    { signer: charlie, name: "Charlie" },
    { signer: david, name: "David" },
    { signer: eve, name: "Eve" }
  ];
  
  for (const account of testAccounts) {
    console.log(`\n${account.name} claiming PlayTokens...`);
    const tx = await playToken.connect(account.signer).claim();
    await tx.wait();
    const balance = await playToken.balanceOf(account.signer.address);
    console.log(`${account.name} balance: ${ethers.formatEther(balance)} PT`);
  }
  
  console.log("\n=== Creating Sample Markets ===");
  
  // Sample markets from miraiMarkets.ts
  const sampleMarkets = [
    {
      title: "Japan Social Security System Sustainability",
      description: "Will Japan's social security system remain sustainable by 2030?",
      outcomes: 3,
      durationDays: 90
    },
    {
      title: "Universal Basic Income Trial",
      description: "Will Japan implement a UBI trial program by 2025?",
      outcomes: 3,
      durationDays: 60
    },
    {
      title: "Tokyo Carbon Neutral Goal",
      description: "Will Tokyo achieve carbon neutrality by 2030?",
      outcomes: 3,
      durationDays: 120
    },
    {
      title: "AI Education Implementation",
      description: "Will AI-based personalized education be implemented in 50% of Japanese schools by 2026?",
      outcomes: 3,
      durationDays: 180
    },
    {
      title: "Remote Work Adoption",
      description: "Will 40% of Japanese companies adopt permanent remote work policies by 2025?",
      outcomes: 3,
      durationDays: 45
    }
  ];
  
  const createdMarkets = [];
  
  for (const marketData of sampleMarkets) {
    console.log(`\nCreating market: ${marketData.title}`);
    
    const currentTime = Math.floor(Date.now() / 1000);
    const tradingDeadline = currentTime + marketData.durationDays * 24 * 60 * 60;
    const resolutionTime = tradingDeadline + 7 * 24 * 60 * 60; // 7 days after trading
    
    const tx = await marketFactory.createMarket(
      marketData.title,
      marketData.description,
      tradingDeadline,
      resolutionTime,
      marketData.outcomes
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
    
    if (marketCreatedEvent) {
      const parsed = marketFactory.interface.parseLog(marketCreatedEvent);
      const marketAddress = parsed.args.market;
      createdMarkets.push({
        address: marketAddress,
        ...marketData
      });
      console.log(`Market created at: ${marketAddress}`);
    }
  }
  
  console.log("\n=== Simulating Trading Activity ===");
  
  // Simulate some trading on the first few markets
  for (let i = 0; i < Math.min(3, createdMarkets.length); i++) {
    const market = await ethers.getContractAt("Market", createdMarkets[i].address);
    const marketTitle = createdMarkets[i].title;
    
    console.log(`\nTrading on market: ${marketTitle}`);
    
    // Approve PlayToken spending for traders
    const traders = [alice, bob, charlie];
    for (const trader of traders) {
      const approveAmount = ethers.parseEther("500");
      await playToken.connect(trader).approve(market.target, approveAmount);
    }
    
    // Simulate some trades
    const trades = [
      { trader: alice, outcome: 0, amount: "100", name: "Alice" },
      { trader: bob, outcome: 1, amount: "150", name: "Bob" },
      { trader: charlie, outcome: 0, amount: "75", name: "Charlie" },
      { trader: alice, outcome: 2, amount: "50", name: "Alice" },
      { trader: bob, outcome: 0, amount: "100", name: "Bob" }
    ];
    
    for (const trade of trades) {
      console.log(`${trade.name} buying ${trade.amount} PT of outcome ${trade.outcome}`);
      const tx = await market.connect(trade.trader).buy(
        trade.outcome,
        ethers.parseEther(trade.amount)
      );
      await tx.wait();
    }
    
    // Display market prices
    console.log("\nCurrent market prices:");
    for (let j = 0; j < 3; j++) {
      const price = await market.getPrice(j);
      console.log(`Outcome ${j}: ${(Number(price) / 1e18 * 100).toFixed(2)}%`);
    }
  }
  
  console.log("\n=== Seeding Summary ===");
  console.log("Test accounts funded:", testAccounts.length);
  console.log("Markets created:", createdMarkets.length);
  console.log("Markets with trading activity:", Math.min(3, createdMarkets.length));
  
  // Save seeded data for reference
  const seedData = {
    network: network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    testAccounts: testAccounts.map(acc => ({
      name: acc.name,
      address: acc.signer.address
    })),
    markets: createdMarkets,
    contractAddresses: addresses
  };
  
  fs.writeFileSync(
    'seed-data-local.json',
    JSON.stringify(seedData, null, 2)
  );
  
  console.log("\nLocal seeding completed successfully!");
  console.log("Seed data saved to seed-data-local.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});