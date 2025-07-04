// Test script to verify category functionality
const { miraiMarkets } = require('./apps/web/src/data/miraiMarkets');

// Count markets by category
const categoryCounts = {};
miraiMarkets.forEach(market => {
  categoryCounts[market.category] = (categoryCounts[market.category] || 0) + 1;
});

console.log('Category Counts:');
console.log('================');
Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`${category}: ${count} markets`);
});

console.log('\nTotal Markets:', miraiMarkets.length);

// List all markets with their categories
console.log('\nMarkets by Category:');
console.log('===================');
miraiMarkets.forEach(market => {
  console.log(`- ${market.title} (${market.category})`);
});