'use strict';
/**
 * MASTER ORCHESTRATOR — run-all-tests.js
 * ----------------------------------------
 * Runs the full VoyageIQ testing pipeline in sequence:
 *   1. Newman API Tests
 *   2. JSON Schema Validation
 *   3. Performance Monitoring
 *   4. Report Generation (HTML + PDF)
 *
 * Exit code: 0 = all pass, 1 = any module failed
 * Used by Jenkinsfile and can be run manually.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(__dirname, '..');

// ── Ensure output dirs ─────────────────────────────────────────────────────
['reports', 'logs'].forEach(dir => {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ── Pipeline steps ─────────────────────────────────────────────────────────
const steps = [
  {
    name:    'Newman API Tests',
    icon:    '🧪',
    script:  path.join(ROOT, 'newman', 'run-tests.js'),
    critical: true
  },
  {
    name:    'JSON Schema Validation',
    icon:    '📋',
    script:  path.join(ROOT, 'schema-validation', 'validate-schemas.js'),
    critical: true
  },
  {
    name:    'Performance Monitoring',
    icon:    '⚡',
    script:  path.join(ROOT, 'performance', 'performance-monitor.js'),
    critical: false  // Warnings don't block deployment
  },
  {
    name:    'Report Generation',
    icon:    '📊',
    script:  path.join(ROOT, 'scripts', 'generate-report.js'),
    critical: false
  }
];

// ── Run ────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     VoyageIQ — Full CI/CD Testing Pipeline               ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log(`║  Timestamp : ${new Date().toISOString().padEnd(42)}║`);
console.log(`║  Root      : ${ROOT.substring(0, 42).padEnd(42)}║`);
console.log('╚══════════════════════════════════════════════════════════╝\n');

const results = [];
let hasBlockingFailure = false;

for (const step of steps) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${step.icon}  STAGE: ${step.name}`);
  console.log('═'.repeat(60));

  const startTime = Date.now();
  try {
    execSync(`node "${step.script}"`, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
      timeout: 120000 // 2 minute timeout per step
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    results.push({ name: step.name, status: 'PASS', elapsed: `${elapsed}s` });
    console.log(`\n  ✅ ${step.name} completed in ${elapsed}s`);
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const exitCode = err.status || 1;
    results.push({ name: step.name, status: 'FAIL', elapsed: `${elapsed}s`, exitCode });

    if (step.critical) {
      hasBlockingFailure = true;
      console.log(`\n  ❌ ${step.name} FAILED (exit code ${exitCode}) in ${elapsed}s`);
      // Continue running non-critical steps for the report, but record the failure
    } else {
      console.log(`\n  ⚠️  ${step.name} completed with warnings (exit code ${exitCode}) in ${elapsed}s`);
    }
  }
}

// ── Final Summary ──────────────────────────────────────────────────────────
console.log('\n\n╔══════════════════════════════════════════════════════════╗');
console.log('║              PIPELINE EXECUTION SUMMARY                  ║');
console.log('╠══════════════════════════════════════════════════════════╣');
results.forEach(r => {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`║  ${icon} ${r.name.padEnd(35)} ${r.status.padEnd(6)} ${r.elapsed.padStart(8)} ║`);
});
console.log('╠══════════════════════════════════════════════════════════╣');
if (hasBlockingFailure) {
  console.log('║  🚫 RESULT: DEPLOYMENT BLOCKED — Critical tests failed   ║');
} else {
  console.log('║  ✅ RESULT: ALL CLEAR — Safe to deploy                   ║');
}
console.log('╚══════════════════════════════════════════════════════════╝\n');

// ── Write pipeline summary log ─────────────────────────────────────────────
const pipelineSummary = {
  timestamp: new Date().toISOString(),
  overallResult: hasBlockingFailure ? 'BLOCKED' : 'PASSED',
  stages: results
};
const logPath = path.join(ROOT, 'logs', `pipeline-summary-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
const latestLog = path.join(ROOT, 'logs', 'pipeline-summary-latest.json');
fs.writeFileSync(logPath, JSON.stringify(pipelineSummary, null, 2));
fs.writeFileSync(latestLog, JSON.stringify(pipelineSummary, null, 2));

// ── Exit code ──────────────────────────────────────────────────────────────
if (hasBlockingFailure) {
  process.exit(1);
}
process.exit(0);
