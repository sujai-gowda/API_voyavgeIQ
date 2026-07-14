'use strict';
/**
 * MODULE 4 — Automated Report Generator
 * ----------------------------------------
 * Reads latest Newman results, schema validation logs, and performance logs.
 * Produces:
 *   - HTML Report → tests/reports/report-<timestamp>.html
 *   - PDF Report  → tests/reports/report-<timestamp>.pdf (via Puppeteer)
 *
 * Can be run standalone or as part of run-all-tests.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.test') });
const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const LOGS_DIR    = path.join(ROOT, 'logs');
[REPORTS_DIR, LOGS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const ts = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const TIMESTAMP = ts();

// ── Load latest logs (graceful if missing) ─────────────────────────────────
function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

const newmanResults   = loadJson(path.join(REPORTS_DIR, 'newman-results-latest.json'));
const schemaResults   = loadJson(path.join(LOGS_DIR, 'schema-validation-latest.json'));
const perfResults     = loadJson(path.join(LOGS_DIR, 'performance-latest.json'));
const failureLog      = loadJson(path.join(LOGS_DIR, 'newman-failures-latest.json'));

// ── Newman summary extraction ──────────────────────────────────────────────
function extractNewmanSummary(data) {
  if (!data || !data.run) return { total: 0, passed: 0, failed: 0, duration: 0, assertions: [] };
  const stats = data.run.stats || {};
  const assertions = stats.assertions || {};
  const total  = assertions.total  || 0;
  const failed = assertions.failed || 0;
  const passed = total - failed;
  const duration = data.run.timings ? data.run.timings.completed - data.run.timings.started : 0;

  // Extract per-request results
  const executions = (data.run.executions || []).map(exec => {
    const reqName = exec.item ? exec.item.name : 'Unknown';
    const respCode = exec.response ? exec.response.code : 'N/A';
    const respTime = exec.response ? exec.response.responseTime : 0;
    const testResults = (exec.assertions || []).map(a => ({
      name:   a.assertion,
      passed: !a.error,
      error:  a.error ? a.error.message : null
    }));
    return { requestName: reqName, statusCode: respCode, responseTime: respTime, tests: testResults };
  });

  return { total, passed, failed, duration, executions };
}

const newman = extractNewmanSummary(newmanResults);

// ── Build HTML ─────────────────────────────────────────────────────────────
function generateHTML() {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Overall pass/fail
  const overallPassed = (newman.failed === 0) &&
    (!schemaResults || schemaResults.summary.failed === 0) &&
    (!perfResults || perfResults.summary.failed === 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VoyageIQ — CI/CD Test Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0a0e1a;
      color: #e0e6f0;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #1a1f3a 0%, #0d1225 100%);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 16px;
      padding: 2rem 2.5rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: ${overallPassed
        ? 'linear-gradient(90deg, #22c55e, #10b981, #34d399)'
        : 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)'};
    }
    .header h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.025em; }
    .header h1 span { color: #818cf8; }
    .header-meta { color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem; }
    .overall-badge {
      display: inline-block;
      padding: 0.375rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      margin-top: 0.75rem;
      background: ${overallPassed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'};
      color: ${overallPassed ? '#22c55e' : '#ef4444'};
      border: 1px solid ${overallPassed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card {
      background: linear-gradient(135deg, #151a30 0%, #0f1322 100%);
      border: 1px solid rgba(99,102,241,0.1);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .stat-card .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.5rem; }
    .stat-card .value { font-size: 2rem; font-weight: 700; }
    .stat-card .value.pass { color: #22c55e; }
    .stat-card .value.fail { color: #ef4444; }
    .stat-card .value.warn { color: #f59e0b; }
    .stat-card .value.neutral { color: #818cf8; }
    .section {
      background: linear-gradient(135deg, #151a30 0%, #0f1322 100%);
      border: 1px solid rgba(99,102,241,0.1);
      border-radius: 12px;
      padding: 1.75rem;
      margin-bottom: 1.5rem;
    }
    .section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(99,102,241,0.1);
    }
    .section h2 .icon { margin-right: 0.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th {
      text-align: left;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(99,102,241,0.1);
    }
    td {
      padding: 0.625rem 1rem;
      border-bottom: 1px solid rgba(99,102,241,0.05);
      vertical-align: top;
    }
    tr:hover td { background: rgba(99,102,241,0.03); }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
    }
    .badge-pass { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-fail { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-warn { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-error { background: rgba(168,85,247,0.15); color: #a855f7; }
    .error-text { color: #f87171; font-size: 0.8rem; font-style: italic; }
    .footer {
      text-align: center;
      padding: 2rem;
      color: #475569;
      font-size: 0.75rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🧭 <span>VoyageIQ</span> — CI/CD Test Report</h1>
      <div class="header-meta">Generated: ${now} | Timestamp: ${TIMESTAMP}</div>
      <div class="overall-badge">${overallPassed ? '✅ ALL TESTS PASSED' : '❌ FAILURES DETECTED'}</div>
    </div>

    <!-- Summary Cards -->
    <div class="grid">
      <div class="stat-card">
        <div class="label">Newman Tests</div>
        <div class="value neutral">${newman.total}</div>
      </div>
      <div class="stat-card">
        <div class="label">Passed</div>
        <div class="value pass">${newman.passed}</div>
      </div>
      <div class="stat-card">
        <div class="label">Failed</div>
        <div class="value ${newman.failed > 0 ? 'fail' : 'pass'}">${newman.failed}</div>
      </div>
      <div class="stat-card">
        <div class="label">Avg Response Time</div>
        <div class="value ${perfResults && perfResults.summary.overallAvgMs > 2000 ? 'fail' : perfResults && perfResults.summary.overallAvgMs > 500 ? 'warn' : 'pass'}">${perfResults ? perfResults.summary.overallAvgMs + 'ms' : 'N/A'}</div>
      </div>
    </div>

    <!-- Newman Results -->
    <div class="section">
      <h2><span class="icon">🧪</span>Newman API Test Results</h2>
      ${newman.executions.length > 0 ? `
      <table>
        <thead><tr><th>Request</th><th>Status</th><th>Response Time</th><th>Tests</th><th>Result</th></tr></thead>
        <tbody>
          ${newman.executions.map(exec => {
            const allPassed = exec.tests.every(t => t.passed);
            const failedTests = exec.tests.filter(t => !t.passed);
            return `<tr>
              <td>${exec.requestName}</td>
              <td>${exec.statusCode}</td>
              <td>${exec.responseTime}ms</td>
              <td>${exec.tests.length} test(s)</td>
              <td><span class="badge ${allPassed ? 'badge-pass' : 'badge-fail'}">${allPassed ? 'PASS' : 'FAIL'}</span>
              ${failedTests.length > 0 ? `<br><span class="error-text">${failedTests.map(t => t.error).join('; ')}</span>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>` : '<p style="color:#64748b;">No Newman results available. Run tests first.</p>'}
    </div>

    <!-- Schema Validation -->
    <div class="section">
      <h2><span class="icon">📋</span>Schema Validation Results</h2>
      ${schemaResults && schemaResults.results ? `
      <table>
        <thead><tr><th>API</th><th>Method</th><th>Response Time</th><th>Status</th><th>Errors</th></tr></thead>
        <tbody>
          ${schemaResults.results.map(r => `<tr>
            <td>${r.name}</td>
            <td>${r.method}</td>
            <td>${r.responseTime}ms</td>
            <td><span class="badge badge-${r.status.toLowerCase() === 'pass' ? 'pass' : r.status.toLowerCase() === 'warn' ? 'warn' : 'fail'}">${r.status}</span></td>
            <td>${r.errors.length > 0 ? `<span class="error-text">${r.errors.slice(0, 3).join('; ')}${r.errors.length > 3 ? '...' : ''}</span>` : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<p style="color:#64748b;">No schema validation results available.</p>'}
    </div>

    <!-- Performance -->
    <div class="section">
      <h2><span class="icon">⚡</span>Performance Monitoring</h2>
      ${perfResults && perfResults.results ? `
      <table>
        <thead><tr><th>Endpoint</th><th>Avg(ms)</th><th>Min(ms)</th><th>Max(ms)</th><th>Errors</th><th>Status</th></tr></thead>
        <tbody>
          ${perfResults.results.map(r => `<tr>
            <td>${r.name}</td>
            <td>${r.avgResponseTime}</td>
            <td>${r.minResponseTime}</td>
            <td>${r.maxResponseTime}</td>
            <td>${r.failedRequests}</td>
            <td><span class="badge badge-${r.status.toLowerCase() === 'pass' ? 'pass' : r.status.toLowerCase() === 'warning' ? 'warn' : 'fail'}">${r.status}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:1rem; padding:1rem; background:rgba(99,102,241,0.05); border-radius:8px;">
        <strong>Thresholds:</strong> &lt;${perfResults.config.passThreshold}ms = PASS | ${perfResults.config.passThreshold}–${perfResults.config.warnThreshold}ms = WARNING | &gt;${perfResults.config.warnThreshold}ms = FAIL
      </div>` : '<p style="color:#64748b;">No performance data available.</p>'}
    </div>

    <!-- Failure Details -->
    ${failureLog && failureLog.failures && failureLog.failures.length > 0 ? `
    <div class="section">
      <h2><span class="icon">🔴</span>Failure Details</h2>
      <table>
        <thead><tr><th>Test Name</th><th>Request</th><th>Status Code</th><th>Response Time</th><th>Error</th></tr></thead>
        <tbody>
          ${failureLog.failures.map(f => `<tr>
            <td>${f.testName}</td>
            <td>${f.requestName}</td>
            <td>${f.responseCode}</td>
            <td>${f.executionTime}ms</td>
            <td><span class="error-text">${f.failureReason}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div class="footer">
      VoyageIQ Continuous Testing Pipeline • Auto-generated report • ${now}
    </div>
  </div>
</body>
</html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     VoyageIQ — Report Generator                      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── Generate HTML ────────────────────────────────────────────────────
  const html = generateHTML();
  const htmlPath   = path.join(REPORTS_DIR, `report-${TIMESTAMP}.html`);
  const latestHtml = path.join(REPORTS_DIR, 'latest-report.html');
  fs.writeFileSync(htmlPath, html);
  fs.writeFileSync(latestHtml, html);
  console.log(`  ✅ HTML Report: ${htmlPath}`);

  // ── Generate PDF via Puppeteer ───────────────────────────────────────
  try {
    const puppeteer = require('puppeteer');
    console.log('  ⏳ Generating PDF (launching headless browser)...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfPath   = path.join(REPORTS_DIR, `report-${TIMESTAMP}.pdf`);
    const latestPdf = path.join(REPORTS_DIR, 'latest-report.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
    });
    fs.copyFileSync(pdfPath, latestPdf);
    await browser.close();
    console.log(`  ✅ PDF Report : ${pdfPath}`);
  } catch (err) {
    console.warn(`  ⚠️  PDF generation skipped (puppeteer not available): ${err.message}`);
    console.log('  💡 To enable PDF: npm install puppeteer in tests/');
  }

  // ── Write combined summary JSON ──────────────────────────────────────
  const combinedSummary = {
    timestamp: new Date().toISOString(),
    newman: {
      total: newman.total,
      passed: newman.passed,
      failed: newman.failed,
      duration: newman.duration
    },
    schemaValidation: schemaResults ? schemaResults.summary : null,
    performance: perfResults ? perfResults.summary : null,
    overallResult: (newman.failed === 0) &&
      (!schemaResults || schemaResults.summary.failed === 0) &&
      (!perfResults || perfResults.summary.failed === 0)
      ? 'PASS' : 'FAIL'
  };

  const summaryPath = path.join(LOGS_DIR, `combined-summary-${TIMESTAMP}.json`);
  const latestSummary = path.join(LOGS_DIR, 'combined-summary-latest.json');
  fs.writeFileSync(summaryPath, JSON.stringify(combinedSummary, null, 2));
  fs.writeFileSync(latestSummary, JSON.stringify(combinedSummary, null, 2));
  console.log(`  ✅ Summary    : ${summaryPath}\n`);
}

main().catch(err => {
  console.error('Report generation error:', err);
  process.exit(1);
});
