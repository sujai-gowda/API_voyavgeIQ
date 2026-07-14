const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Helper for colored console outputs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function logHeader(title) {
  console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✔ SUCCESS: ${message}${colors.reset}`);
}

function logFailure(message, error) {
  console.log(`${colors.red}✘ FAILURE: ${message}${colors.reset}`);
  if (error) {
    console.log(`${colors.dim}${error.stack || error.message || error}${colors.reset}`);
  }
}

function logInfo(message) {
  console.log(`${colors.yellow}ℹ INFO: ${message}${colors.reset}`);
}

async function runTest(testName, fn) {
  const startTime = Date.now();
  console.log(`\n${colors.bright}▶ Testing: ${testName}...${colors.reset}`);
  try {
    await fn();
    const duration = Date.now() - startTime;
    logSuccess(`${testName} completed in ${duration}ms`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logFailure(`${testName} failed after ${duration}ms`, error);
    return false;
  }
}

async function startSystemTesting() {
  logHeader('VOYAGEIQ SYSTEM INTEGRATION TESTING');
  logInfo(`Target Gateway: ${BASE_URL}`);
  logInfo(`API Endpoint: ${API_URL}`);
  
  let passedCount = 0;
  let totalCount = 0;
  
  const results = [];

  // 1. Health Check
  totalCount++;
  const t1 = await runTest('Gateway Health Check (GET /)', async () => {
    const res = await axios.get(`${BASE_URL}/`);
    if (res.status !== 200 || res.data.status !== 'healthy') {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
    console.log(`  Message: "${res.data.message}"`);
    console.log(`  Status: ${res.data.status}`);
  });
  results.push({ name: 'Gateway Health Check', passed: t1 });
  if (t1) passedCount++;

  const searchParams = {
    from: 'delhi',
    to: 'mumbai',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    returnDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    travelers: 2,
    budget: 80000
  };

  // 2. Aggregated Search
  totalCount++;
  const t2 = await runTest('Aggregated Search (GET /api/search/all)', async () => {
    logInfo(`Searching ${searchParams.from.toUpperCase()} to ${searchParams.to.toUpperCase()} for ${searchParams.date}`);
    const res = await axios.get(`${API_URL}/search/all`, { params: searchParams });
    if (res.status !== 200) {
      throw new Error(`HTTP Status ${res.status}`);
    }
    const data = res.data;
    console.log(`  ✈️ Flights Found     : ${data.flights?.length || 0}`);
    console.log(`  🏨 Hotels Found      : ${data.hotels?.length || 0}`);
    console.log(`  🚂 Trains Found      : ${data.trains?.length || 0}`);
    console.log(`  🗺️  Destination City  : ${data.destination?.city || 'N/A'}`);
    console.log(`  🌡️  Weather Condition: ${data.destination?.weather?.temp}°C, ${data.destination?.weather?.condition}`);
    
    if (!data.flights || !data.hotels || !data.trains || !data.destination) {
      throw new Error('Response object missing key attributes');
    }
  });
  results.push({ name: 'Aggregated Search API', passed: t2 });
  if (t2) passedCount++;

  // 3. Flights Endpoint
  totalCount++;
  const t3 = await runTest('Flights Direct (GET /api/search/flights)', async () => {
    const res = await axios.get(`${API_URL}/search/flights`, { params: searchParams });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  Returned ${res.data.length} flights`);
    if (res.data.length > 0) {
      const f = res.data[0];
      console.log(`  Sample Flight: ${f.carrier} (${f.flightNumber}) - Price: ₹${f.price} - Score: ${f.score}`);
    }
  });
  results.push({ name: 'Flights Filter API', passed: t3 });
  if (t3) passedCount++;

  // 4. Hotels Endpoint
  totalCount++;
  const t4 = await runTest('Hotels Direct (GET /api/search/hotels)', async () => {
    const res = await axios.get(`${API_URL}/search/hotels`, { params: searchParams });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  Returned ${res.data.length} hotels`);
    if (res.data.length > 0) {
      const h = res.data[0];
      console.log(`  Sample Hotel: ${h.name} - Rating: ${h.rating}★ - Price: ₹${h.price} - Score: ${h.score}`);
    }
  });
  results.push({ name: 'Hotels Filter API', passed: t4 });
  if (t4) passedCount++;

  // 5. Trains Endpoint
  totalCount++;
  const t5 = await runTest('Trains Direct (GET /api/search/trains)', async () => {
    const res = await axios.get(`${API_URL}/search/trains`, { params: searchParams });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  Returned ${res.data.length} trains`);
    if (res.data.length > 0) {
      const tr = res.data[0];
      console.log(`  Sample Train: ${tr.name} (${tr.trainNumber}) - Price: ₹${tr.price} - Score: ${tr.score}`);
    }
  });
  results.push({ name: 'Trains Filter API', passed: t5 });
  if (t5) passedCount++;

  // 6. Destination Endpoint
  totalCount++;
  const t6 = await runTest('Destination Direct (GET /api/search/destination)', async () => {
    const res = await axios.get(`${API_URL}/search/destination`, { params: searchParams });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  City: ${res.data.city}`);
    console.log(`  Safety Score: ${res.data.safetyScore}/10`);
    console.log(`  Best Season: ${res.data.bestSeason}`);
  });
  results.push({ name: 'Destination Intelligence API', passed: t6 });
  if (t6) passedCount++;

  // 7. AI Price Prediction
  totalCount++;
  const t7 = await runTest('AI Price Trend Prediction (POST /api/ai/predict-price-trend)', async () => {
    const res = await axios.post(`${API_URL}/ai/predict-price-trend`, {
      from: searchParams.from,
      to: searchParams.to,
      date: searchParams.date,
      price: 8000
    });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  Recommendation: ${res.data.recommendation}`);
    console.log(`  Confidence: ${res.data.confidence}%`);
    console.log(`  Explanation: "${res.data.explanation}"`);
    console.log(`  Trend Points: ${res.data.trend?.prices?.length || 0} historical entries`);
  });
  results.push({ name: 'AI Price Trend API', passed: t7 });
  if (t7) passedCount++;

  // 8. AI Budget Plan Optimization
  totalCount++;
  const t8 = await runTest('AI Budget Package recommendation (POST /api/ai/budget-plan)', async () => {
    const res = await axios.post(`${API_URL}/ai/budget-plan`, {
      from: searchParams.from,
      to: searchParams.to,
      date: searchParams.date,
      budget: searchParams.budget,
      travelers: searchParams.travelers
    });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  Packages Created: ${res.data.packages?.length || 0}`);
    if (res.data.packages?.length > 0) {
      res.data.packages.forEach((pkg, idx) => {
        console.log(`    [Package ${idx + 1}] ${pkg.name}: Total Cost: ₹${pkg.totalCost} | Score: ${pkg.score} | Budget Met: ${pkg.withinBudget ? 'YES' : 'NO'}`);
      });
    }
  });
  results.push({ name: 'AI Budget Optimizer API', passed: t8 });
  if (t8) passedCount++;

  // 9. AI Chat Assistant
  totalCount++;
  const t9 = await runTest('AI Chatbot responder (POST /api/ai/chat)', async () => {
    const testMessage = 'Suggest a budget trip to Dubai in winter';
    logInfo(`Sending query: "${testMessage}"`);
    const res = await axios.post(`${API_URL}/ai/chat`, {
      message: testMessage,
      history: []
    });
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`);
    console.log(`  AI Reply (Truncated): "${res.data.reply ? res.data.reply.slice(0, 120) + '...' : 'No reply'}"`);
  });
  results.push({ name: 'AI Chatbot API', passed: t9 });
  if (t9) passedCount++;

  // 10. Cache Management
  totalCount++;
  const t10 = await runTest('Cache Stats & Clearing (GET /api/cache/stats)', async () => {
    const statsRes = await axios.get(`${API_URL}/cache/stats`);
    if (statsRes.status !== 200) throw new Error(`HTTP Status ${statsRes.status}`);
    console.log(`  Current Cached Keys Count: ${statsRes.data.keysCount ?? 'unknown'}`);
    console.log(`  Cache Engine Status      : ${statsRes.data.isMockInMemory ? 'In-Memory Cache (MongoDB offline/fallback)' : 'MongoDB Connected'}`);
  });
  results.push({ name: 'Cache Management API', passed: t10 });
  if (t10) passedCount++;

  // Final Summary Report
  logHeader('TESTING REPORT SUMMARY');
  results.forEach(r => {
    const statusText = r.passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(`  - ${r.name.padEnd(50)} : [ ${statusText} ]`);
  });
  console.log(`\n${colors.bright}Result: ${passedCount}/${totalCount} tests passed.${colors.reset}`);
  
  if (passedCount === totalCount) {
    console.log(`${colors.green}${colors.bright}🎉 SUCCESS: All systems and APIs are integrated correctly!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}⚠️  WARNING: Some integration tests failed. Check specific logs above.${colors.reset}\n`);
  }
}

startSystemTesting();
