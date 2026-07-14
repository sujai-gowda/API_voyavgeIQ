const express = require('express');
const router = express.Router();
const axios = require('axios');
const { searchAll, runLocalScoring } = require('../services/travelService');
const { getCacheStats, clearCache } = require('../cache/cache');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// Helper to extract search queries from request
const getSearchParams = (req) => {
  const { from, to, date, returnDate, travelers, budget } = req.query;
  if (!from || !to || !date) {
    throw new Error('Missing required search parameters (from, to, date)');
  }
  return {
    from: String(from),
    to: String(to),
    date: String(date),
    returnDate: returnDate ? String(returnDate) : '',
    travelers: travelers ? parseInt(String(travelers), 10) : 1,
    budget: budget ? parseInt(String(budget), 10) : 50000
  };
};

// 1. Aggregated Search Route
router.get('/search/all', async (req, res) => {
  try {
    const params = getSearchParams(req);
    const data = await searchAll(
      params.from,
      params.to,
      params.date,
      params.returnDate,
      params.travelers,
      params.budget
    );
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Individual Search Routes (Filtering from Aggregated Search to ensure single pipeline consistency)
router.get('/search/flights', async (req, res) => {
  try {
    const params = getSearchParams(req);
    const data = await searchAll(params.from, params.to, params.date, params.returnDate, params.travelers, params.budget);
    res.json(data.flights);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/search/hotels', async (req, res) => {
  try {
    const params = getSearchParams(req);
    const data = await searchAll(params.from, params.to, params.date, params.returnDate, params.travelers, params.budget);
    res.json(data.hotels);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/search/trains', async (req, res) => {
  try {
    const params = getSearchParams(req);
    const data = await searchAll(params.from, params.to, params.date, params.returnDate, params.travelers, params.budget);
    res.json(data.trains);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/search/destination', async (req, res) => {
  try {
    const params = getSearchParams(req);
    const data = await searchAll(params.from, params.to, params.date, params.returnDate, params.travelers, params.budget);
    res.json(data.destination);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. AI Rank Endpoint (Manual request)
router.post('/ai/rank', async (req, res) => {
  const { flights, hotels, trains } = req.body;
  
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/rank`, { flights, hotels, trains }, { timeout: 3000 });
    res.json(response.data);
  } catch (error) {
    console.warn('⚠️  FastAPI AI Rank proxy failed. Falling back to local ranking.');
    const localScored = runLocalScoring(flights || [], hotels || [], trains || []);
    res.json(localScored);
  }
});

// 4. Price Prediction Endpoint
router.post('/ai/predict-price-trend', async (req, res) => {
  const { from, to, date, price } = req.body;
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/predict-price-trend`, { from, to, date, price }, { timeout: 3000 });
    res.json(response.data);
  } catch (error) {
    console.warn('⚠️  FastAPI Price Prediction failed. Using JS local predictor.');
    
    // JS Local Price Trend Fallback (High Fidelity Mock Prediction)
    const basePrice = price || 6000;
    const daysToDate = Math.max(1, Math.round((new Date(date) - Date.now()) / (1000 * 60 * 60 * 24)));
    
    let recommendation = 'Buy Now';
    let confidence = 85;
    let explanation = 'Prices for this route are historically stable but show upward pressure due to proximity.';

    if (daysToDate > 21) {
      recommendation = 'Wait';
      confidence = 72;
      explanation = 'We predict a brief price drop in the coming weeks. Monitor and book around 14 days before.';
    } else if (daysToDate < 7) {
      recommendation = 'Buy Now';
      confidence = 94;
      explanation = 'Last minute booking window is closing. Prices are expected to surge by 15-20% in the next 48 hours.';
    }

    // Generate 7-day trend history
    const history = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Calculate a trend
      let factor = 1;
      if (daysToDate < 7) {
        factor = 0.95 - (i * 0.01) + (Math.random() * 0.02); // upward
      } else if (daysToDate > 21) {
        factor = 1.05 - (Math.random() * 0.04); // volatile/down
      } else {
        factor = 1.0 + (Math.sin(i) * 0.03) + (Math.random() * 0.01); // oscillation
      }
      history.push(Math.round(basePrice * factor));
    }

    res.json({
      recommendation,
      confidence,
      explanation,
      trend: {
        labels,
        prices: history
      }
    });
  }
});

// 5. AI Budget Planner Endpoint
router.post('/ai/budget-plan', async (req, res) => {
  const { from, to, date, budget, travelers } = req.body;
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/recommend-package`, {
      from, to, date, budget, travelers
    }, { timeout: 3000 });
    res.json(response.data);
  } catch (error) {
    console.warn('⚠️  FastAPI Budget Plan failed. Using JS local optimizer.');
    
    // JS Local Budget Optimization Fallback
    const budgetVal = budget ? Number(budget) : 50000;
    const travelersVal = travelers ? Number(travelers) : 1;

    // Search cache or get new mock items to package
    const data = await searchAll(from, to, date, '', travelersVal, budgetVal);
    
    const flights = data.flights;
    const hotels = data.hotels;
    const trains = data.trains;

    // Helper: Build package
    const buildPackage = (flightOrTrain, hotel, packageName, description) => {
      const transportCost = flightOrTrain ? flightOrTrain.price : 0;
      const hotelCost = hotel ? hotel.price * 3 : 0; // 3 nights default
      const totalCost = transportCost + hotelCost;
      const score = Math.round(((flightOrTrain ? flightOrTrain.score : 0) + (hotel ? hotel.score : 0)) / 2);
      
      return {
        name: packageName,
        description,
        transport: flightOrTrain,
        hotel: hotel,
        nights: 3,
        totalCost,
        score,
        withinBudget: totalCost <= budgetVal
      };
    };

    // Sort by cost/score
    const cheapestFlight = flights.sort((a,b)=>a.price-b.price)[0];
    const cheapestTrain = trains.length > 0 ? trains.sort((a,b)=>a.price-b.price)[0] : null;
    const cheapestHotel = hotels.sort((a,b)=>a.price-b.price)[0];

    const bestValueFlight = flights.sort((a,b)=>b.score-a.score)[0];
    const bestValueHotel = hotels.sort((a,b)=>b.score-a.score)[0];

    const luxuryFlight = flights.sort((a,b)=>b.price-a.price)[0];
    const luxuryHotel = hotels.sort((a,b)=>b.price-a.price)[0];

    const packages = [
      buildPackage(cheapestTrain || cheapestFlight, cheapestHotel, 'Eco Backpacker', 'Maximum savings package using budget transportation and affordable stays.'),
      buildPackage(bestValueFlight, bestValueHotel, 'Smart Explorer', 'Highly recommended! Optimizes for flight schedule convenience and highly rated stays.'),
      buildPackage(luxuryFlight, luxuryHotel, 'Premium Escape', 'Luxury class transport with 5-star premium lodging and top tier amenities.')
    ];

    res.json({
      budget: budgetVal,
      travelers: travelersVal,
      packages: packages.filter(p => p.totalCost > 0)
    });
  }
});

// 6. AI Chatbot Agent Endpoint
router.post('/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/chat`, { message, history }, { timeout: 4000 });
    res.json(response.data);
  } catch (error) {
    console.warn('⚠️  FastAPI Chat API failed. Using local rule-based NLP.');
    
    // JS Local NLP Fallback Chatbot
    const input = message.toLowerCase();
    let reply = "";
    
    if (input.includes('hello') || input.includes('hi ') || input.includes('hey')) {
      reply = "Hello! I'm your VoyageIQ AI assistant. Ask me anything about travel routes, pricing trends, safety, or budgets!";
    } else if (input.includes('tokyo')) {
      reply = "Tokyo is an amazing destination! The average daily cost is around ₹15,000. It is extremely safe (Safety Score: 9.8/10). Best months are during Cherry Blossom season (March to May) or autumn (October/November). You should expect flights to cost around ₹35,000+ from India.";
    } else if (input.includes('goa')) {
      reply = "Goa is perfect for beaches and relaxation! The average cost is about ₹4,500/day. Best season is November to February. It has moderate crowds in the winter, and is very safe. You can travel via trains like Vande Bharat Express or flights from Mumbai/Bangalore for under ₹5,000.";
    } else if (input.includes('dubai')) {
      reply = "Dubai offers high-end luxury and adventure! Best season to visit is November to March when temperatures are comfortable (~25°C). It is exceptionally safe (Safety: 9.5/10) with major highlights like Burj Khalifa, desert safaris, and beach resorts. Daily cost is around ₹12,000.";
    } else if (input.includes('budget') || input.includes('cheap')) {
      reply = "To travel within a budget, I suggest: 1) Booking flights at least 14 days in advance, 2) Swapping flights for trains (e.g. Vande Bharat/Rajdhani) for routes under 800km, 3) Choosing 'Smart Explorer' packages which balance cost and rating. Would you like me to analyze a specific destination budget?";
    } else if (input.includes('weather') || input.includes('best time')) {
      reply = "For general destinations, October to March is the ideal season. For East Asia, Spring (March-May) is famous. For Europe, early Summer (June) offers long pleasant days without peak August crowds. Tell me where you are headed and I will give you detailed seasonal forecasts!";
    } else {
      reply = "That's an interesting question! While I don't have access to live web search for that exact item right now, I can tell you that planning flights 2-3 weeks out and looking at our 'Best Value' calculation in the search tab will give you the most efficient pricing. Let me know if you want to set up an itinerary!";
    }

    res.json({ reply });
  }
});

// 7. Cache Management Routes
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cache/clear', async (req, res) => {
  try {
    await clearCache();
    res.json({ message: 'Cache successfully cleared!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
