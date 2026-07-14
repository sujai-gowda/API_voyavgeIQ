# VoyageIQ — Intelligent Multi-API Travel Decision Engine

VoyageIQ is a production-grade full-stack travel aggregation engine that searches flights, hotels, trains, and destinations in parallel. It normalizes data from different API sources, caches payloads in MongoDB to avoid rate-limits, and ranks combinations using an AI Decision microservice scoring model.

---

## 🏗️ System Architecture

```text
React.js (Vite)  ──>  Express API Gateway  ──>  MongoDB / In-Memory Cache
                            │
                            ├──>  Parallel API Calls (Amadeus, Booking, IRCTC, TripAdvisor)
                            │
                            └──>  Python FastAPI Engine  ──>  Linear Regression Predictor
                                                             └─> Knapsack Budget Optimizer
```

- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion (animations), Recharts (charts), Axios.
- **Backend API Gateway**: Node.js, Express.js. Concurrent fetching engine utilizing `Promise.allSettled` to query airlines, lodging, trains, and weather in under 3 seconds.
- **Cache Layer**: MongoDB (automatic 10-minute TTL expiration). Automatically falls back to high-fidelity In-Memory JavaScript storage if MongoDB is not running locally.
- **AI Engine (Microservice)**: Python FastAPI, Scikit-learn, Pandas, NumPy.
  - Multi-objective decision matrix ranking.
  - Machine learning Linear Regression price predictor.
  - Combinatorial package budget optimizer.

---

## 🛠️ Step-by-Step Installation & Running Guide

Ensure you have **Node.js (v18+)** and **Python (v3.9+)** installed.

### 1. Run Python AI Microservice
Navigate to the `ai-engine/` folder and setup a virtual environment:

```bash
cd ai-engine
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service (runs on http://localhost:8000)
python main.py
```

### 2. Run Express Backend Gateway
Navigate to the `backend/` folder, copy `.env.example`, and start Node:

```bash
cd backend
# Install dependencies
npm install

# Setup local configurations
copy .env.example .env

# Run server (runs on http://localhost:5000)
npm run dev
```

### 3. Run React Frontend
Navigate to the `frontend/` folder and start Vite:

```bash
cd frontend
# Install dependencies
npm install

# Start developer server (runs on http://localhost:5173)
npm run dev
```

---

## ⚙️ API Configurations & Mock Fallbacks

To connect production endpoints, update the `backend/.env` file:
* **Flights**: Amadeus Developers client ID & secret.
* **Hotels**: Booking.com partner keys or RapidAPI equivalent.
* **Trains**: Indian Railway RapidAPI endpoints.
* **Destinations**: TripAdvisor / GeoDB Cities endpoints.
* **Weather**: OpenWeather API keys.
* **AI Assistant**: OpenAI API keys.

> [!TIP]
> **Out-of-the-Box Mock Mode**: If no API keys are supplied in `backend/.env`, the system automatically activates a dynamic, high-fidelity mock generator. It builds realistic routes (e.g. IndiGo/Air India/Emirates, Radisson/Taj Hotels, Shatabdi/Kerala Express trains) and calculates real price trends, so you can test all features offline instantly!
>
> If the Python FastAPI microservice is offline, the Node backend will activate a JavaScript failover ranking engine, so page results are always successfully scored.

---

## ⚖️ AI Scoring Calculation

The FastAPI ranking engine evaluates options using a weighted composite formula:

$$\text{Value Score} = (1 - P_{norm}) \times 40 + D_{norm} \times 20 + \frac{R}{5} \times 15 + C_{norm} \times 10 + Pop_{norm} \times 10 - S_{penalty}$$

* **Price Efficiency (40%)**: Ratio of minimum price found to the current option's cost.
* **Travel Duration (20%)**: Speed ratio based on fastest transit route.
* **Lodging/Transit Rating (15%)**: Out of 5-stars.
* **Stops Penalty (5%)**: Deducts value for connecting flights or multi-stop transits.
* **Convenience & Popularity (20%)**: Factoring travel departure time windows (8 AM - 8 PM is optimal) and carrier reputation.
