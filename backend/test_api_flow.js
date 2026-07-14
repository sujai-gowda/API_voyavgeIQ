// test_api_flow.js
// Simple system test script that exercises the core travelService API functions
// and prints progress messages to the terminal as each operation runs.

// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const { searchAll } = require('./services/travelService');
const { connectDB } = require('./cache/cache');

// Helper to parse CLI arguments with defaults
const args = process.argv.slice(2);
const defaultParams = {
  from: 'delhi',
  to: 'mumbai',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
  returnDate: '',
  travelers: 1,
  budget: 50000
};

const params = {
  from: args[0] || defaultParams.from,
  to: args[1] || defaultParams.to,
  date: args[2] || defaultParams.date,
  returnDate: args[3] || defaultParams.returnDate,
  travelers: parseInt(args[4] || defaultParams.travelers, 10),
  budget: parseInt(args[5] || defaultParams.budget, 10)
};

// Colors for terminal formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}         VoyageIQ System Integration API Test Runner${colors.reset}`);
console.log(`${colors.bright}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`🔎 Test parameters:`, params);

(async () => {
  try {
    // 1. Connect Database Cache
    console.log(`\n${colors.yellow}🔌 Connecting to Database Cache...${colors.reset}`);
    const dbConnected = await connectDB();
    if (dbConnected) {
      console.log(`${colors.green}✔ Database connected successfully.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ Running in In-Memory fallback cache mode.${colors.reset}`);
    }

    // 2. Fetch Aggregated Data
    console.log(`\n${colors.yellow}🛫 Executing searchAll() workflow (Querying Travel APIs)...${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}------------------------------------------------------------${colors.reset}`);
    const result = await searchAll(params.from, params.to, params.date, params.returnDate, params.travelers, params.budget);
    console.log(`${colors.bright}${colors.blue}------------------------------------------------------------${colors.reset}`);

    // 3. Log results summary
    console.log(`\n${colors.bright}${colors.green}🎉 Search completed successfully!${colors.reset}`);
    console.log(`📊 Result Summary:`);
    console.log(`   ✈️  Flights fetched: ${colors.bright}${result.flights?.length ?? 0}${colors.reset}`);
    console.log(`   🏨 Hotels fetched : ${colors.bright}${result.hotels?.length ?? 0}${colors.reset}`);
    console.log(`   🚂 Trains fetched : ${colors.bright}${result.trains?.length ?? 0}${colors.reset}`);
    console.log(`   🗺️  Destination    : ${colors.bright}${result.destination?.city ?? 'N/A'}${colors.reset}`);

    // 4. Print samples if available
    if (result.flights && result.flights.length > 0) {
      const f = result.flights[0];
      console.log(`\n💡 Sample Flight: ${colors.cyan}${f.carrier} (${f.flightNumber})${colors.reset} | Price: ₹${f.price} | Score: ${f.score}`);
    }
    if (result.hotels && result.hotels.length > 0) {
      const h = result.hotels[0];
      console.log(`💡 Sample Hotel: ${colors.cyan}${h.name}${colors.reset} | Rating: ${h.rating}★ | Price: ₹${h.price} | Score: ${h.score}`);
    }
    if (result.trains && result.trains.length > 0) {
      const t = result.trains[0];
      console.log(`💡 Sample Train: ${colors.cyan}${t.name} (${t.trainNumber})${colors.reset} | Price: ₹${t.price} | Score: ${t.score}`);
    }
    if (result.destination) {
      console.log(`💡 Destination Weather: ${colors.cyan}${result.destination.weather?.temp}°C, ${result.destination.weather?.condition}${colors.reset}`);
    }

  } catch (err) {
    console.error(`\n${colors.red}❌ System test failed with error:${colors.reset}`, err);
  } finally {
    // 5. Clean exit
    console.log(`\n${colors.yellow}🔌 Closing database connection...${colors.reset}`);
    await mongoose.connection.close();
    console.log(`${colors.green}✔ Done. Exiting test.${colors.reset}\n`);
    process.exit(0);
  }
})();

