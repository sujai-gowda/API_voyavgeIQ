# VoyageIQ — Continuous Testing Pipeline

> Enterprise-grade CI/CD automated API testing framework for VoyageIQ travel application.
> This testing layer operates **externally** — zero modifications to existing application code.

---

## 📁 Folder Structure

```
tests/
├── postman/
│   ├── VoyageIQ_API_Tests.postman_collection.json   # 35+ test cases
│   └── VoyageIQ_Test_Environment.postman_environment.json
├── newman/
│   └── run-tests.js                                  # Programmatic Newman runner
├── schema-validation/
│   ├── schemas/
│   │   ├── flight.schema.json
│   │   ├── hotel.schema.json
│   │   ├── train.schema.json
│   │   ├── destination.schema.json
│   │   ├── ai-rank.schema.json
│   │   ├── price-trend.schema.json
│   │   └── budget-plan.schema.json
│   └── validate-schemas.js
├── performance/
│   └── performance-monitor.js
├── scripts/
│   ├── run-all-tests.js                              # Master orchestrator
│   └── generate-report.js                            # HTML + PDF report generator
├── reports/                                           # Auto-generated reports
├── logs/                                              # Auto-generated JSON logs
├── dashboard/
│   ├── index.html
│   ├── dashboard.css
│   └── dashboard.js
├── package.json
├── .env.test
└── README.md                                          # This file

Jenkinsfile                                             # CI/CD pipeline (project root)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **VoyageIQ backend** running on port 5000
- (Optional) **Jenkins** for CI/CD automation

### Step 1: Install Test Dependencies

```bash
cd tests
npm install
```

> ⚠️ This installs dependencies in `tests/node_modules` only — completely isolated from backend/frontend.

### Step 2: Start the Backend

```bash
# In a separate terminal
cd backend
npm start
```

### Step 3: Run All Tests

```bash
cd tests
npm test
```

This runs the full pipeline:
1. Newman API tests (Postman collection)
2. JSON Schema validation
3. Performance monitoring
4. Report generation (HTML + PDF)

---

## 📋 Individual Test Modules

### Newman API Tests
```bash
cd tests
npm run test:newman
# OR
node newman/run-tests.js
```

### Schema Validation
```bash


# OR
node schema-validation/validate-schemas.js
```

### Performance Monitoring
```bash
npm run test:performance
# OR
node performance/performance-monitor.js
```

### Report Generation (standalone)
```bash
npm run report
# OR
node scripts/generate-report.js
```

---

## 📊 Reports

After test execution, reports are generated in `tests/reports/`:

| File | Description |
|------|-------------|
| `latest-report.html` | Full HTML test report (dark-themed, styled) |
| `latest-report.pdf` | PDF version of the report |
| `newman-report-latest.html` | Newman-specific HTML report (htmlextra) |
| `newman-results-latest.json` | Raw Newman JSON output |

Open the HTML report in any browser:
```bash
start tests/reports/latest-report.html
```

---

## 🖥️ Testing Dashboard

A self-contained web dashboard that visualizes test results:

```bash
cd tests
npx serve dashboard -p 3001
```

Then open `http://localhost:3001` in your browser.

**Dashboard shows:**
- Overall pass/fail status with animated indicator
- Test count summary cards
- API health status table
- Response time bar chart with threshold lines
- Schema validation results
- Pipeline stage execution results
- Failed test details

---

## 🔧 Jenkins CI/CD Pipeline

### Setup

1. Ensure Jenkins has the **NodeJS plugin** installed
2. Configure a NodeJS installation named `NodeJS-18` in Jenkins Global Tool Configuration
3. Install the **HTML Publisher** plugin for report viewing
4. Create a **Pipeline** job pointing to this repository
5. Set the pipeline to use `Jenkinsfile` from SCM

### Pipeline Stages

| Stage | Description |
|-------|-------------|
| Checkout | Pull latest code |
| Install Backend Deps | `npm install` in `backend/` |
| Install Test Deps | `npm install` in `tests/` |
| Start Backend Server | Launch Express server in background |
| Run Newman API Tests | Execute Postman collection via Newman |
| Run Schema Validation | Validate API responses against JSON schemas |
| Run Performance Tests | Measure response times against thresholds |
| Generate Reports | Create HTML + PDF reports |
| Check Results | Gate: blocks deployment if critical tests fail |

### Deployment Gate

If any **critical** test fails (Newman or Schema), the pipeline:
- Marks the build as **FAILURE**
- **Blocks deployment** (will not continue)
- Archives all logs and reports for debugging

---

## ⚙️ Configuration

Edit `tests/.env.test` to customize:

```env
# Backend URL
BASE_URL=http://localhost:5000

# Performance thresholds (ms)
PERF_PASS_THRESHOLD=500
PERF_WARN_THRESHOLD=2000

# Test data
TEST_FROM=DEL
TEST_TO=BOM
TEST_DATE=2026-08-15
```

---

## 📝 Test Coverage

### Endpoints Tested (12 total)

| Endpoint | Method | Tests |
|----------|--------|-------|
| `/` | GET | Health check, status, response time |
| `/api/search/flights` | GET | Status, array, fields, types, errors |
| `/api/search/hotels` | GET | Status, array, fields, types, errors |
| `/api/search/trains` | GET | Status, array, fields, types, errors |
| `/api/search/destination` | GET | Status, object, fields |
| `/api/search/all` | GET | Status, aggregated structure |
| `/api/ai/rank` | POST | Status, scored arrays |
| `/api/ai/predict-price-trend` | POST | Status, trend fields |
| `/api/ai/budget-plan` | POST | Status, packages array |
| `/api/ai/chat` | POST | Status, reply field |
| `/api/cache/stats` | GET | Status, object |
| `/api/cache/clear` | POST | Status, message |

### Test Types

- ✅ **Status code validation** — HTTP 200/400 checks
- ✅ **Response format** — JSON parsing validation
- ✅ **Field existence** — Required field presence checks
- ✅ **Data type validation** — AJV schema type enforcement
- ✅ **Error handling** — Missing parameter error responses
- ✅ **Performance** — Response time threshold checks
- ✅ **Schema compliance** — Full JSON Schema draft-07 validation

---

## 📂 Log Files

All logs are structured JSON in `tests/logs/`:

| File | Content |
|------|---------|
| `newman-failures-latest.json` | Failed test assertions with details |
| `schema-validation-latest.json` | Schema validation results per endpoint |
| `performance-latest.json` | Response time measurements and thresholds |
| `combined-summary-latest.json` | Consolidated summary of all test modules |
| `pipeline-summary-latest.json` | Pipeline stage execution results |

---

## ⚠️ Important Notes

1. **No existing code is modified** — all tests run externally against the live API
2. **Test dependencies are isolated** — `tests/node_modules` is separate from app
3. **Backend must be running** before executing tests
4. **Reports auto-update** — latest reports are always at `*-latest.*` filenames
5. **Exit codes** — all scripts return `exit(1)` on failure for CI/CD integration
