'use strict';
/**
 * MODULE 2 — JSON Schema Validation
 * -----------------------------------
 * Calls each VoyageIQ API endpoint, validates response against
 * AJV JSON Schema (draft-07), reports PASS/FAIL per field.
 *
 * Output: tests/logs/schema-validation-<timestamp>.json
 * Exit code: 0 = all pass, 1 = failures
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.test') });
const Ajv    = require('ajv');
const addFormats = require('ajv-formats');
const axios  = require('axios');
const path   = require('path');
const fs     = require('fs');

// ── Setup ──────────────────────────────────────────────────────────────────
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const BASE_URL   = process.env.BASE_URL || 'http://localhost:5000';
const LOGS_DIR   = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const ts = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const TIMESTAMP = ts();

// ── Load schemas ───────────────────────────────────────────────────────────
const SCHEMAS_DIR = path.join(__dirname, 'schemas');
const loadSchema = (name) => JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, name), 'utf-8'));

const flightSchema      = loadSchema('flight.schema.json');
const hotelSchema        = loadSchema('hotel.schema.json');
const trainSchema        = loadSchema('train.schema.json');
const destinationSchema  = loadSchema('destination.schema.json');
const aiRankSchema       = loadSchema('ai-rank.schema.json');
const priceTrendSchema   = loadSchema('price-trend.schema.json');
const budgetPlanSchema   = loadSchema('budget-plan.schema.json');

// ── Test data ──────────────────────────────────────────────────────────────
const searchParams = `from=${process.env.TEST_FROM || 'DEL'}&to=${process.env.TEST_TO || 'BOM'}&date=${process.env.TEST_DATE || '2026-08-15'}&returnDate=${process.env.TEST_RETURN_DATE || '2026-08-20'}&travelers=${process.env.TEST_TRAVELERS || '2'}&budget=${process.env.TEST_BUDGET || '50000'}`;

// ── Validation targets ─────────────────────────────────────────────────────
const validationTargets = [
  {
    name: 'Flight Search',
    endpoint: `${BASE_URL}/api/search/flights?${searchParams}`,
    method: 'GET',
    schema: flightSchema,
    isArray: true,
    description: 'Validates individual flight objects in the array response'
  },
  {
    name: 'Hotel Search',
    endpoint: `${BASE_URL}/api/search/hotels?${searchParams}`,
    method: 'GET',
    schema: hotelSchema,
    isArray: true,
    description: 'Validates individual hotel objects in the array response'
  },
  {
    name: 'Train Search',
    endpoint: `${BASE_URL}/api/search/trains?${searchParams}`,
    method: 'GET',
    schema: trainSchema,
    isArray: true,
    description: 'Validates individual train objects in the array response'
  },
  {
    name: 'Destination Info',
    endpoint: `${BASE_URL}/api/search/destination?from=${process.env.TEST_FROM || 'DEL'}&to=${process.env.TEST_TO || 'BOM'}&date=${process.env.TEST_DATE || '2026-08-15'}`,
    method: 'GET',
    schema: destinationSchema,
    isArray: false,
    description: 'Validates the destination info object'
  },
  {
    name: 'AI Rank',
    endpoint: `${BASE_URL}/api/ai/rank`,
    method: 'POST',
    schema: aiRankSchema,
    isArray: false,
    body: {
      flights: [{ id: 'FL-01', type: 'flight', carrier: 'IndiGo', price: 4500, stops: 0, duration: 120 }],
      hotels:  [{ id: 'HT-01', type: 'hotel', name: 'Test Hotel', price: 3000, rating: 4.2, distance: 2.5 }],
      trains:  [{ id: 'TR-01', type: 'train', name: 'Rajdhani Express', price: 1200, duration: 480 }]
    },
    description: 'Validates the AI ranking response structure'
  },
  {
    name: 'Price Trend Prediction',
    endpoint: `${BASE_URL}/api/ai/predict-price-trend`,
    method: 'POST',
    schema: priceTrendSchema,
    isArray: false,
    body: { from: 'DEL', to: 'BOM', date: '2026-08-15', price: 5500 },
    description: 'Validates the price trend prediction response'
  },
  {
    name: 'Budget Plan',
    endpoint: `${BASE_URL}/api/ai/budget-plan`,
    method: 'POST',
    schema: budgetPlanSchema,
    isArray: false,
    body: { from: 'DEL', to: 'BOM', date: '2026-08-15', budget: 50000, travelers: 2 },
    description: 'Validates the budget plan response structure'
  }
];

// ── Validate a single target ───────────────────────────────────────────────
async function validateTarget(target) {
  const result = {
    name:        target.name,
    endpoint:    target.endpoint,
    method:      target.method,
    description: target.description,
    status:      'PENDING',
    errors:      [],
    fieldResults: [],
    responseTime: 0
  };

  try {
    const startTime = Date.now();
    let response;
    if (target.method === 'POST') {
      response = await axios.post(target.endpoint, target.body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
    } else {
      response = await axios.get(target.endpoint, { timeout: 15000 });
    }
    result.responseTime = Date.now() - startTime;

    const data = response.data;

    // If array response, validate each item
    if (target.isArray) {
      if (!Array.isArray(data)) {
        result.status = 'FAIL';
        result.errors.push('Expected array response but got: ' + typeof data);
        return result;
      }
      if (data.length === 0) {
        result.status = 'WARN';
        result.errors.push('Array is empty — cannot validate item schema');
        return result;
      }

      // Validate first 3 items
      const itemsToCheck = data.slice(0, 3);
      let allValid = true;
      itemsToCheck.forEach((item, idx) => {
        const validate = ajv.compile(target.schema);
        const valid = validate(item);
        if (!valid) {
          allValid = false;
          validate.errors.forEach(err => {
            result.errors.push(`Item[${idx}] ${err.instancePath || '/'}: ${err.message}`);
            result.fieldResults.push({
              field: err.instancePath || '/',
              status: 'FAIL',
              message: err.message,
              itemIndex: idx
            });
          });
        }
      });

      // Also log the fields that passed
      const requiredFields = target.schema.required || [];
      requiredFields.forEach(field => {
        const present = itemsToCheck[0] && itemsToCheck[0].hasOwnProperty(field);
        const expectedType = target.schema.properties && target.schema.properties[field]
          ? (Array.isArray(target.schema.properties[field].type) ? target.schema.properties[field].type[0] : target.schema.properties[field].type)
          : 'unknown';
        const actualType = itemsToCheck[0] ? typeof itemsToCheck[0][field] : 'undefined';
        const typeMatch = present && (actualType === expectedType || expectedType === 'unknown' || (itemsToCheck[0][field] === null && Array.isArray(target.schema.properties[field].type)));

        result.fieldResults.push({
          field,
          status: present && typeMatch ? 'PASS' : (present ? 'TYPE_MISMATCH' : 'MISSING'),
          expectedType,
          actualType: present ? actualType : 'N/A',
          value: present ? (typeof itemsToCheck[0][field] === 'object' ? JSON.stringify(itemsToCheck[0][field]).slice(0, 50) : String(itemsToCheck[0][field]).slice(0, 50)) : 'N/A'
        });
      });

      result.status = allValid ? 'PASS' : 'FAIL';
    } else {
      // Single object validation
      const validate = ajv.compile(target.schema);
      const valid = validate(data);
      if (!valid) {
        result.status = 'FAIL';
        validate.errors.forEach(err => {
          result.errors.push(`${err.instancePath || '/'}: ${err.message}`);
          result.fieldResults.push({
            field: err.instancePath || '/',
            status: 'FAIL',
            message: err.message
          });
        });
      } else {
        result.status = 'PASS';
      }

      // Log required field checks
      const requiredFields = target.schema.required || [];
      requiredFields.forEach(field => {
        const present = data && data.hasOwnProperty(field);
        result.fieldResults.push({
          field,
          status: present ? 'PASS' : 'MISSING',
          value: present ? (typeof data[field] === 'object' ? JSON.stringify(data[field]).slice(0, 50) : String(data[field]).slice(0, 50)) : 'N/A'
        });
      });
    }

  } catch (err) {
    result.status = 'ERROR';
    result.errors.push(err.response ? `HTTP ${err.response.status}: ${err.response.statusText}` : err.message);
  }

  return result;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     VoyageIQ — JSON Schema Validation Runner         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Schemas  : ${SCHEMAS_DIR}`);
  console.log(`  Targets  : ${validationTargets.length}\n`);

  const results = [];
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;
  let errorCount = 0;

  for (const target of validationTargets) {
    process.stdout.write(`  Validating ${target.name.padEnd(25)} ... `);
    const result = await validateTarget(target);
    results.push(result);

    switch (result.status) {
      case 'PASS':  passCount++;  console.log('✅ PASS'); break;
      case 'FAIL':  failCount++;  console.log('❌ FAIL'); break;
      case 'WARN':  warnCount++;  console.log('⚠️  WARN'); break;
      case 'ERROR': errorCount++; console.log('💥 ERROR'); break;
    }

    if (result.errors.length > 0) {
      result.errors.forEach(e => console.log(`    → ${e}`));
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(54));
  console.log(`  Schema Validation Summary`);
  console.log('═'.repeat(54));
  console.log(`  Total    : ${results.length}`);
  console.log(`  Passed   : ${passCount} ✅`);
  console.log(`  Failed   : ${failCount} ❌`);
  console.log(`  Warnings : ${warnCount} ⚠️`);
  console.log(`  Errors   : ${errorCount} 💥`);
  console.log('═'.repeat(54));

  // ── Write log ──────────────────────────────────────────────────────────
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: { total: results.length, passed: passCount, failed: failCount, warnings: warnCount, errors: errorCount },
    results
  };

  const logFile    = path.join(LOGS_DIR, `schema-validation-${TIMESTAMP}.json`);
  const latestFile = path.join(LOGS_DIR, 'schema-validation-latest.json');
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(latestFile, JSON.stringify(report, null, 2));
  console.log(`\n  Log written: ${logFile}\n`);

  // Exit code for CI/CD
  if (failCount > 0 || errorCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
