'use strict';
/**
 * MODULE 3 — Performance Monitoring
 * -----------------------------------
 * Measures response time for every VoyageIQ API endpoint.
 * Applies thresholds:
 *   < 500ms  → PASS ✅
 *   500–2000 → WARNING ⚠️
 *   > 2000   → FAIL ❌
 *
 * Runs each call N=3 times and averages.
 * Output: tests/logs/performance-<timestamp>.json
 * Exit code: 0 = all pass/warn, 1 = any fail
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.test') });
const axios = require('axios');
const path  = require('path');
const fs    = require('fs');

// ── Config ─────────────────────────────────────────────────────────────────
const BASE_URL       = process.env.BASE_URL || 'http://localhost:5000';
const PASS_THRESHOLD = parseInt(process.env.PERF_PASS_THRESHOLD, 10) || 500;
const WARN_THRESHOLD = parseInt(process.env.PERF_WARN_THRESHOLD, 10) || 2000;
const ITERATIONS     = 3;
const LOGS_DIR       = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const ts = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const TIMESTAMP = ts();

// ── Search params ──────────────────────────────────────────────────────────
const searchParams = `from=${process.env.TEST_FROM || 'DEL'}&to=${process.env.TEST_TO || 'BOM'}&date=${process.env.TEST_DATE || '2026-08-15'}&returnDate=${process.env.TEST_RETURN_DATE || '2026-08-20'}&travelers=${process.env.TEST_TRAVELERS || '2'}&budget=${process.env.TEST_BUDGET || '50000'}`;

// ── Endpoints to test ──────────────────────────────────────────────────────
const endpoints = [
  { name: 'Health Check',          method: 'GET',  url: `${BASE_URL}/` },
  { name: 'Flight Search',        method: 'GET',  url: `${BASE_URL}/api/search/flights?${searchParams}` },
  { name: 'Hotel Search',         method: 'GET',  url: `${BASE_URL}/api/search/hotels?${searchParams}` },
  { name: 'Train Search',         method: 'GET',  url: `${BASE_URL}/api/search/trains?${searchParams}` },
  { name: 'Destination Search',   method: 'GET',  url: `${BASE_URL}/api/search/destination?from=DEL&to=BOM&date=2026-08-15` },
  { name: 'Aggregated Search',    method: 'GET',  url: `${BASE_URL}/api/search/all?${searchParams}` },
  {
    name: 'AI Rank',
    method: 'POST',
    url: `${BASE_URL}/api/ai/rank`,
    body: {
      flights: [{ id: 'FL-01', type: 'flight', carrier: 'IndiGo', price: 4500, stops: 0, duration: 120 }],
      hotels:  [{ id: 'HT-01', type: 'hotel', name: 'Test Hotel', price: 3000, rating: 4.2, distance: 2.5 }],
      trains:  [{ id: 'TR-01', type: 'train', name: 'Rajdhani', price: 1200, duration: 480 }]
    }
  },
  {
    name: 'Price Trend Prediction',
    method: 'POST',
    url: `${BASE_URL}/api/ai/predict-price-trend`,
    body: { from: 'DEL', to: 'BOM', date: '2026-08-15', price: 5500 }
  },
  {
    name: 'AI Chat',
    method: 'POST',
    url: `${BASE_URL}/api/ai/chat`,
    body: { message: 'Hello, tell me about Goa', history: [] }
  },
  { name: 'Cache Stats',  method: 'GET',  url: `${BASE_URL}/api/cache/stats` }
];

// ── Measure a single request ───────────────────────────────────────────────
async function measureRequest(ep) {
  const startTime = Date.now();
  try {
    let response;
    if (ep.method === 'POST') {
      response = await axios.post(ep.url, ep.body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
    } else {
      response = await axios.get(ep.url, { timeout: 15000 });
    }
    const duration = Date.now() - startTime;
    return {
      success:      true,
      statusCode:   response.status,
      responseTime: duration,
      error:        null
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    return {
      success:      false,
      statusCode:   err.response ? err.response.status : 0,
      responseTime: duration,
      error:        err.response ? `HTTP ${err.response.status}` : err.message
    };
  }
}

// ── Classify performance ───────────────────────────────────────────────────
function classify(avgMs) {
  if (avgMs < PASS_THRESHOLD) return 'PASS';
  if (avgMs <= WARN_THRESHOLD) return 'WARNING';
  return 'FAIL';
}

function statusIcon(status) {
  switch (status) {
    case 'PASS':    return '✅';
    case 'WARNING': return '⚠️';
    case 'FAIL':    return '❌';
    default:        return '💥';
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     VoyageIQ — API Performance Monitor               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log(`  Base URL      : ${BASE_URL}`);
  console.log(`  Iterations    : ${ITERATIONS} per endpoint`);
  console.log(`  Thresholds    : <${PASS_THRESHOLD}ms=PASS | ${PASS_THRESHOLD}-${WARN_THRESHOLD}ms=WARN | >${WARN_THRESHOLD}ms=FAIL`);
  console.log(`  Endpoints     : ${endpoints.length}\n`);
  console.log('─'.repeat(80));
  console.log(`  ${'Endpoint'.padEnd(28)} ${'Avg(ms)'.padStart(8)} ${'Min(ms)'.padStart(8)} ${'Max(ms)'.padStart(8)} ${'Status'.padStart(10)} ${'Errors'.padStart(8)}`);
  console.log('─'.repeat(80));

  const results = [];
  let hasFail = false;

  for (const ep of endpoints) {
    const measurements = [];
    let failedRequests = 0;
    let lastError = null;

    for (let i = 0; i < ITERATIONS; i++) {
      const m = await measureRequest(ep);
      measurements.push(m);
      if (!m.success) {
        failedRequests++;
        lastError = m.error;
      }
    }

    const times = measurements.map(m => m.responseTime);
    const avg   = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min   = Math.min(...times);
    const max   = Math.max(...times);

    let perfStatus;
    if (failedRequests === ITERATIONS) {
      perfStatus = 'ERROR';
      hasFail = true;
    } else {
      perfStatus = classify(avg);
      if (perfStatus === 'FAIL') hasFail = true;
    }

    const result = {
      name:           ep.name,
      endpoint:       ep.url,
      method:         ep.method,
      iterations:     ITERATIONS,
      avgResponseTime: avg,
      minResponseTime: min,
      maxResponseTime: max,
      failedRequests,
      status:         perfStatus,
      lastError,
      measurements:   measurements.map(m => ({
        responseTime: m.responseTime,
        statusCode:   m.statusCode,
        success:      m.success
      }))
    };
    results.push(result);

    console.log(`  ${ep.name.padEnd(28)} ${String(avg).padStart(8)} ${String(min).padStart(8)} ${String(max).padStart(8)} ${(statusIcon(perfStatus) + ' ' + perfStatus).padStart(10)} ${String(failedRequests).padStart(8)}`);
  }

  console.log('─'.repeat(80));

  // ── Summary stats ──────────────────────────────────────────────────────
  const passCount = results.filter(r => r.status === 'PASS').length;
  const warnCount = results.filter(r => r.status === 'WARNING').length;
  const failCount = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
  const overallAvg = Math.round(results.reduce((a, r) => a + r.avgResponseTime, 0) / results.length);

  console.log(`\n  Overall Avg Response Time : ${overallAvg}ms`);
  console.log(`  Passed   : ${passCount} ✅`);
  console.log(`  Warnings : ${warnCount} ⚠️`);
  console.log(`  Failed   : ${failCount} ❌`);

  // ── Write log ──────────────────────────────────────────────────────────
  const report = {
    timestamp:  new Date().toISOString(),
    baseUrl:    BASE_URL,
    config:     { iterations: ITERATIONS, passThreshold: PASS_THRESHOLD, warnThreshold: WARN_THRESHOLD },
    summary:    { total: results.length, passed: passCount, warnings: warnCount, failed: failCount, overallAvgMs: overallAvg },
    results
  };

  const logFile    = path.join(LOGS_DIR, `performance-${TIMESTAMP}.json`);
  const latestFile = path.join(LOGS_DIR, 'performance-latest.json');
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(latestFile, JSON.stringify(report, null, 2));
  console.log(`\n  Log written: ${logFile}\n`);

  if (hasFail) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
