'use strict';
/**
 * MODULE 1 — Newman Programmatic Runner
 * ----------------------------------------
 * Executes the VoyageIQ Postman collection using Newman.
 * Generates:
 *   - JSON report  → tests/reports/newman-results-<timestamp>.json
 *   - HTML report  → tests/reports/newman-report-<timestamp>.html
 * Writes failure logs → tests/logs/newman-failures-<timestamp>.json
 *
 * Exit code: 0 = all pass, 1 = failures detected (CI/CD pipeline gate)
 */

require('dotenv').config({ path: '../.env.test' });
const newman = require('newman');
const path   = require('path');
const fs     = require('fs');

// ── Resolve paths ──────────────────────────────────────────────────────────
const ROOT          = path.resolve(__dirname, '..');
const COLLECTION    = path.join(ROOT, 'postman', 'VoyageIQ_API_Tests.postman_collection.json');
const REPORTS_DIR   = path.join(ROOT, 'reports');
const LOGS_DIR      = path.join(ROOT, 'logs');

// ── Ensure output directories exist ───────────────────────────────────────
[REPORTS_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Timestamp helper ───────────────────────────────────────────────────────
const ts = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const TIMESTAMP = ts();

// ── Build environment overrides from .env.test ─────────────────────────────
const envVars = [
  { key: 'BASE_URL',     value: process.env.BASE_URL     || 'http://localhost:5000' },
  { key: 'FROM',         value: process.env.TEST_FROM    || 'DEL' },
  { key: 'TO',           value: process.env.TEST_TO      || 'BOM' },
  { key: 'DATE',         value: process.env.TEST_DATE    || '2026-08-15' },
  { key: 'RETURN_DATE',  value: process.env.TEST_RETURN_DATE || '2026-08-20' },
  { key: 'TRAVELERS',    value: process.env.TEST_TRAVELERS   || '2' },
  { key: 'BUDGET',       value: process.env.TEST_BUDGET      || '50000' }
];

// ── Output file paths ──────────────────────────────────────────────────────
const jsonReportPath = path.join(REPORTS_DIR, `newman-results-${TIMESTAMP}.json`);
const htmlReportPath = path.join(REPORTS_DIR, `newman-report-${TIMESTAMP}.html`);
const latestJsonPath = path.join(REPORTS_DIR, 'newman-results-latest.json');
const latestHtmlPath = path.join(REPORTS_DIR, 'newman-report-latest.html');

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║       VoyageIQ — Newman API Test Runner              ║');
console.log('╚══════════════════════════════════════════════════════╝\n');
console.log(`  Collection : ${COLLECTION}`);
console.log(`  Base URL   : ${envVars[0].value}`);
console.log(`  Test Data  : ${envVars[1].value} → ${envVars[2].value} on ${envVars[3].value}`);
console.log(`  JSON Report: ${jsonReportPath}`);
console.log(`  HTML Report: ${htmlReportPath}\n`);

// ── Run Newman ─────────────────────────────────────────────────────────────
newman.run(
  {
    collection:  require(COLLECTION),
    environment: { values: envVars },
    reporters:   ['cli', 'json', 'htmlextra'],
    reporter: {
      json: {
        export: jsonReportPath
      },
      htmlextra: {
        export:         htmlReportPath,
        title:          'VoyageIQ API Test Report',
        darkTheme:      true,
        showMarkdownLinks: true,
        omitRequestBodies: false,
        showEnvironmentData: true,
        skipSensitiveData: false,
        browserTitle:   'VoyageIQ Tests',
        showGlobalData: true,
        skipHeaders:    '',
        logs:           true,
        testPaging:     true
      }
    },
    // Abort on first failure — set false to get full report even with failures
    abortOnFailure: false,
    // Timeout for individual requests (ms)
    timeoutRequest: 10000,
    // Timeout for individual test scripts (ms)
    timeoutScript: 5000
  },
  function (err, summary) {

    // ── Build failure log entries ────────────────────────────────────────
    const failures = [];
    if (summary && summary.run && summary.run.failures) {
      summary.run.failures.forEach(f => {
        failures.push({
          timestamp:     new Date().toISOString(),
          testName:      f.error && f.error.test  || 'Unknown Test',
          requestName:   f.source && f.source.name || 'Unknown Request',
          endpoint:      f.source && f.source.request && f.source.request.url ? f.source.request.url.toString() : 'N/A',
          errorType:     'TEST_ASSERTION_FAILURE',
          responseCode:  f.source && f.source.response && f.source.response.code || 'N/A',
          executionTime: f.source && f.source.response && f.source.response.responseTime || 0,
          failureReason: f.error && f.error.message || 'No message'
        });
      });
    }

    // ── Write failure log ────────────────────────────────────────────────
    if (failures.length > 0) {
      const failLogPath = path.join(LOGS_DIR, `newman-failures-${TIMESTAMP}.json`);
      const latestFailPath = path.join(LOGS_DIR, 'newman-failures-latest.json');
      fs.writeFileSync(failLogPath, JSON.stringify({ timestamp: TIMESTAMP, failures }, null, 2));
      fs.writeFileSync(latestFailPath, JSON.stringify({ timestamp: TIMESTAMP, failures }, null, 2));
      console.log(`\n  ⚠️  Failure log written: ${failLogPath}`);
    }

    // ── Copy "latest" symlinks ───────────────────────────────────────────
    try {
      if (fs.existsSync(jsonReportPath)) fs.copyFileSync(jsonReportPath, latestJsonPath);
      if (fs.existsSync(htmlReportPath)) fs.copyFileSync(htmlReportPath, latestHtmlPath);
    } catch (copyErr) {
      console.warn('  Could not copy latest report:', copyErr.message);
    }

    // ── Final summary ────────────────────────────────────────────────────
    if (err || (summary && summary.run.failures.length > 0)) {
      const total    = summary ? summary.run.stats.tests.total    : 0;
      const failed   = summary ? summary.run.failures.length      : 0;
      const passed   = total - failed;
      console.log('\n╔══════════════════════════════════════════════════════╗');
      console.log('║              TEST RUN COMPLETE — FAILURES             ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log(`  Total  : ${total}`);
      console.log(`  Passed : ${passed} ✅`);
      console.log(`  Failed : ${failed} ❌`);
      console.log(`\n  HTML Report: ${htmlReportPath}\n`);
      process.exit(1); // Non-zero exit — blocks CI/CD deployment
    } else {
      const total  = summary ? summary.run.stats.tests.total : 0;
      const passed = summary ? summary.run.stats.tests.pending + total - (summary.run.failures || []).length : total;
      console.log('\n╔══════════════════════════════════════════════════════╗');
      console.log('║             TEST RUN COMPLETE — ALL PASSED            ║');
      console.log('╚══════════════════════════════════════════════════════╝');
      console.log(`  Total Passed : ${total} ✅`);
      console.log(`\n  HTML Report: ${htmlReportPath}\n`);
      process.exit(0);
    }
  }
);
