const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the page
  await page.goto('http://localhost:3001');
  
  // Wait for the cards to load
  await page.waitForSelector('.grid > a');
  
  // Get all card elements
  const cards = await page.$$('.grid > a > div');
  
  console.log('Card measurements:');
  
  for (let i = 0; i < cards.length && i < 5; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    
    // Get the market title
    const title = await card.$eval('h3', el => el.textContent);
    
    // Check if it's a binary or multiple choice market
    const hasProposals = await card.$('div[class*="bg-"][class*="rounded-lg p-2.5"]');
    const type = hasProposals ? 'Multiple Choice' : 'Binary';
    
    console.log(`\nCard ${i + 1} (${type}):`);
    console.log(`Title: ${title}`);
    console.log(`Height: ${box.height}px`);
    console.log(`Width: ${box.width}px`);
  }
  
  // Take a screenshot for visual inspection
  await page.screenshot({ path: 'cards-before.png', fullPage: true });
  
  await browser.close();
})();