/**
 * VoyageIQ Testing Dashboard — JavaScript
 * ==========================================
 * Reads JSON log files from ../logs/ and renders them into the dashboard.
 * Works when served via any static file server (e.g. npx serve dashboard).
 */

// ── Log file base path (relative to dashboard/) ────────────────────────────
const LOGS_BASE  = '../logs';
const REPORTS_BASE = '../reports';

// ── Fetch JSON helper ──────────────────────────────────────────────────────
async function fetchJson(url) {
  try {
    const resp = await fetch(url + '?t=' + Date.now());
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// ── Load all data ──────────────────────────────────────────────────────────
async function loadAllData() {
  const [perfData, schemaData, pipelineData, failureData, combinedData] = await Promise.all([
    fetchJson(`${LOGS_BASE}/performance-latest.json`),
    fetchJson(`${LOGS_BASE}/schema-validation-latest.json`),
    fetchJson(`${LOGS_BASE}/pipeline-summary-latest.json`),
    fetchJson(`${LOGS_BASE}/newman-failures-latest.json`),
    fetchJson(`${LOGS_BASE}/combined-summary-latest.json`)
  ]);

  renderStatusBanner(combinedData, pipelineData);
  renderStatCards(combinedData, perfData);
  renderHealthTable(perfData);
  renderPerformanceChart(perfData);
  renderSchemaTable(schemaData);
  renderPipelineStages(pipelineData);
  renderFailures(failureData);
  updateTimestamp(combinedData || perfData || schemaData);
}

// ── Update timestamp ───────────────────────────────────────────────────────
function updateTimestamp(data) {
  const el = document.getElementById('last-updated');
  if (data && data.timestamp) {
    const d = new Date(data.timestamp);
    el.textContent = `CI/CD Pipeline Monitor • Last run: ${d.toLocaleString('en-IN')}`;
  } else {
    el.textContent = 'CI/CD Pipeline Monitor • No data found — run tests first';
  }
}

// ── Status Banner ──────────────────────────────────────────────────────────
function renderStatusBanner(combined, pipeline) {
  const indicator = document.getElementById('status-indicator');
  const dot       = document.getElementById('status-dot');
  const text      = document.getElementById('status-text');

  let isPass = false;
  if (combined) {
    isPass = combined.overallResult === 'PASS';
  } else if (pipeline) {
    isPass = pipeline.overallResult === 'PASSED';
  }

  const hasData = !!(combined || pipeline);
  indicator.className = 'status-indicator ' + (hasData ? (isPass ? 'pass' : 'fail') : 'loading');
  dot.className       = 'status-dot ' + (hasData ? (isPass ? 'pass' : 'fail') : '');
  text.textContent    = hasData
    ? (isPass ? '✅ All Systems Operational — All tests passed' : '❌ Issues Detected — Some tests failed')
    : '⏳ No test data available — run the test suite first';
}

// ── Stat Cards ─────────────────────────────────────────────────────────────
function renderStatCards(combined, perf) {
  const valTotal   = document.getElementById('val-total');
  const valPassed  = document.getElementById('val-passed');
  const valFailed  = document.getElementById('val-failed');
  const valAvgTime = document.getElementById('val-avg-time');

  if (combined && combined.newman) {
    valTotal.textContent  = combined.newman.total || 0;
    valPassed.textContent = combined.newman.passed || 0;
    valFailed.textContent = combined.newman.failed || 0;

    // Color the failed card
    const failCard = document.getElementById('stat-failed');
    if (combined.newman.failed > 0) {
      failCard.classList.add('card-fail');
    } else {
      failCard.classList.remove('card-fail');
      failCard.classList.add('card-pass');
    }
  }

  if (perf && perf.summary) {
    valAvgTime.textContent = perf.summary.overallAvgMs + 'ms';
  }
}

// ── Health Table ───────────────────────────────────────────────────────────
function renderHealthTable(perf) {
  const tbody = document.getElementById('health-tbody');
  if (!perf || !perf.results) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No performance data available. Run: node performance/performance-monitor.js</td></tr>';
    return;
  }

  tbody.innerHTML = perf.results.map(r => {
    const badgeClass = r.status === 'PASS' ? 'badge-pass' : r.status === 'WARNING' ? 'badge-warn' : 'badge-fail';
    return `<tr>
      <td>${r.name}</td>
      <td>${r.method}</td>
      <td><strong>${r.avgResponseTime}ms</strong></td>
      <td>${r.minResponseTime}ms</td>
      <td>${r.maxResponseTime}ms</td>
      <td>${r.failedRequests}</td>
      <td><span class="badge ${badgeClass}">${r.status}</span></td>
    </tr>`;
  }).join('');
}

// ── Performance Chart (SVG bar chart) ──────────────────────────────────────
function renderPerformanceChart(perf) {
  const svg    = document.getElementById('perf-chart');
  const legend = document.getElementById('chart-legend');
  svg.innerHTML = '';
  legend.innerHTML = '';

  if (!perf || !perf.results || perf.results.length === 0) {
    svg.innerHTML = '<text x="250" y="140" fill="#64748b" text-anchor="middle" font-size="13" font-family="Inter, sans-serif">No performance data available</text>';
    return;
  }

  const data = perf.results;
  const maxTime = Math.max(...data.map(d => d.maxResponseTime), 100);
  const barCount = data.length;

  // Chart dimensions
  const chartLeft   = 55;
  const chartRight  = 480;
  const chartTop    = 20;
  const chartBottom = 230;
  const chartWidth  = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Grid lines
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const y = chartTop + (chartHeight / gridSteps) * i;
    const val = Math.round(maxTime - (maxTime / gridSteps) * i);
    svg.innerHTML += `<line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}" stroke="rgba(99,102,241,0.08)" stroke-width="1"/>`;
    svg.innerHTML += `<text x="${chartLeft - 8}" y="${y + 4}" fill="#64748b" text-anchor="end" font-size="9" font-family="Inter, sans-serif">${val}ms</text>`;
  }

  // Threshold lines
  const passY = chartBottom - (perf.config.passThreshold / maxTime) * chartHeight;
  const warnY = chartBottom - (perf.config.warnThreshold / maxTime) * chartHeight;
  if (passY > chartTop) {
    svg.innerHTML += `<line x1="${chartLeft}" y1="${passY}" x2="${chartRight}" y2="${passY}" stroke="rgba(34,197,94,0.3)" stroke-width="1" stroke-dasharray="4,4"/>`;
    svg.innerHTML += `<text x="${chartRight + 3}" y="${passY + 3}" fill="#22c55e" font-size="8" font-family="Inter, sans-serif">${perf.config.passThreshold}ms</text>`;
  }
  if (warnY > chartTop) {
    svg.innerHTML += `<line x1="${chartLeft}" y1="${warnY}" x2="${chartRight}" y2="${warnY}" stroke="rgba(239,68,68,0.3)" stroke-width="1" stroke-dasharray="4,4"/>`;
    svg.innerHTML += `<text x="${chartRight + 3}" y="${warnY + 3}" fill="#ef4444" font-size="8" font-family="Inter, sans-serif">${perf.config.warnThreshold}ms</text>`;
  }

  // Bars
  const barWidth  = Math.min(32, (chartWidth / barCount) * 0.55);
  const barGap    = chartWidth / barCount;

  const colors = {
    PASS:    '#22c55e',
    WARNING: '#f59e0b',
    FAIL:    '#ef4444',
    ERROR:   '#a855f7'
  };

  data.forEach((d, i) => {
    const x = chartLeft + barGap * i + (barGap - barWidth) / 2;
    const barH = (d.avgResponseTime / maxTime) * chartHeight;
    const y = chartBottom - barH;
    const color = colors[d.status] || '#818cf8';

    // Shadow
    svg.innerHTML += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${color}" opacity="0.15"/>`;
    // Bar
    svg.innerHTML += `<rect x="${x + 1}" y="${y + 1}" width="${barWidth - 2}" height="${barH - 1}" rx="3" fill="${color}" opacity="0.8"/>`;
    // Value label
    svg.innerHTML += `<text x="${x + barWidth / 2}" y="${y - 4}" fill="${color}" text-anchor="middle" font-size="8" font-weight="600" font-family="Inter, sans-serif">${d.avgResponseTime}ms</text>`;
    // Name label (rotated)
    const labelY = chartBottom + 14;
    const shortName = d.name.length > 12 ? d.name.slice(0, 11) + '…' : d.name;
    svg.innerHTML += `<text x="${x + barWidth / 2}" y="${labelY}" fill="#94a3b8" text-anchor="middle" font-size="7.5" font-family="Inter, sans-serif">${shortName}</text>`;
  });

  // Legend
  legend.innerHTML = [
    { color: '#22c55e', label: `PASS (<${perf.config.passThreshold}ms)` },
    { color: '#f59e0b', label: `WARN (${perf.config.passThreshold}-${perf.config.warnThreshold}ms)` },
    { color: '#ef4444', label: `FAIL (>${perf.config.warnThreshold}ms)` }
  ].map(l => `<div class="legend-item"><div class="legend-dot" style="background:${l.color}"></div>${l.label}</div>`).join('');
}

// ── Schema Validation Table ────────────────────────────────────────────────
function renderSchemaTable(schema) {
  const tbody = document.getElementById('schema-tbody');
  if (!schema || !schema.results) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No schema data. Run: node schema-validation/validate-schemas.js</td></tr>';
    return;
  }

  tbody.innerHTML = schema.results.map(r => {
    const cls = r.status === 'PASS' ? 'badge-pass' : r.status === 'WARN' ? 'badge-warn' : 'badge-fail';
    return `<tr>
      <td>${r.name}</td>
      <td>${r.responseTime}ms</td>
      <td><span class="badge ${cls}">${r.status}</span></td>
    </tr>`;
  }).join('');
}

// ── Pipeline Stages ────────────────────────────────────────────────────────
function renderPipelineStages(pipeline) {
  const container = document.getElementById('pipeline-stages');
  if (!pipeline || !pipeline.stages) {
    container.innerHTML = '<div class="empty-state">No pipeline data. Run: node scripts/run-all-tests.js</div>';
    return;
  }

  container.innerHTML = pipeline.stages.map(s => {
    const cls = s.status === 'PASS' ? 'pass' : 'fail';
    const badgeCls = s.status === 'PASS' ? 'badge-pass' : 'badge-fail';
    return `<div class="pipeline-stage ${cls}">
      <div class="stage-name">${s.name}</div>
      <div class="stage-meta">
        <span class="stage-time">${s.elapsed}</span>
        <span class="badge ${badgeCls}">${s.status}</span>
      </div>
    </div>`;
  }).join('');
}

// ── Failures ───────────────────────────────────────────────────────────────
function renderFailures(failures) {
  const panel = document.getElementById('panel-failures');
  const tbody = document.getElementById('failure-tbody');

  if (!failures || !failures.failures || failures.failures.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  tbody.innerHTML = failures.failures.map(f => `<tr>
    <td>${f.testName}</td>
    <td>${f.requestName}</td>
    <td>${f.responseCode}</td>
    <td style="color:#f87171; font-size:0.75rem; font-style:italic;">${f.failureReason}</td>
  </tr>`).join('');
}

// ── Initial load ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadAllData);
