const axios = require('axios');
const { getCache, setCache } = require('../cache/cache');
const {
  generateMockFlights,
  generateMockHotels,
  generateMockTrains,
  generateMockDestination
} = require('../utils/normalize');

// Load environment variables for APIs
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// ─── Price estimator for Aviationstack (which doesn't return pricing) ───────
// Uses airline tier + approximate distance bucket to produce realistic INR fares.
const AIRLINE_BASE_FARES = {
  // Full-service carriers (INR)
  AI: 4500, '6E': 3200, SG: 3000, UK: 4200, IX: 3100,
  // International carriers
  EK: 28000, QR: 26000, SQ: 32000, BA: 38000, LH: 35000, AF: 34000,
  // Default if unknown
  DEFAULT: 3800
};

const estimateFlightPrice = (iataFrom, iataTo, carrier, stops, travelers) => {
  const base = AIRLINE_BASE_FARES[carrier] || AIRLINE_BASE_FARES.DEFAULT;
  // Very rough distance bucket by IATA code string distance (good-enough heuristic)
  const intlMultiplier = (iataFrom.length === 3 && iataTo.length === 3 &&
    iataFrom.charCodeAt(0) !== iataTo.charCodeAt(0)) ? 2.8 : 1;
  const stopSurcharge = stops * base * 0.15;
  const totalPerPerson = Math.round((base * intlMultiplier + stopSurcharge) * (0.85 + Math.random() * 0.3));
  return totalPerPerson * travelers;
};

// API Fetchers
const fetchFlights = async (from, to, date, travelers) => {
  const hasSkyScrapper = process.env.AVIATIONSTACK_KEY;

  if (!hasSkyScrapper) {
    console.log(`✈️ [Mock Flights] Generating for ${from} -> ${to} on ${date}`);
    return generateMockFlights(from, to, date, travelers);
  }

  try {
    console.log('✈️ [Sky Scrapper API] Querying real API...');

    const response = await axios.get(
      'https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlightEverywhereDetails',
      {
        params: {
          oneWay: false,
          currency: 'USD',

          // Depending on API docs, may need these fields
          originSkyId: from.toUpperCase(),
          destinationSkyId: to.toUpperCase(),
          departureDate: date
        },

        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com',
          'x-rapidapi-key': process.env.AVIATIONSTACK_KEY
        },

        timeout: 8000
      }
    );

    const data = response.data?.data;

    if (!data || !Array.isArray(data.itineraries) || data.itineraries.length === 0) {
      throw new Error('Sky Scrapper returned no flights — falling back to mock');
    }

    const flights = data.itineraries.map((flight, idx) => {

      return {
        id: `FL-AV-${idx}`,

        type: "flight",

        provider: "AviationStack",

        carrier: flight.airline?.name || "Unknown Airline",

        flightNumber:
          flight.flight?.iata ||
          flight.flight?.number ||
          `FL${idx}`,

        // AviationStack free and standard plans do not provide prices
        price: null,

        departureTime:
          flight.departure?.scheduled ||
          new Date(date).toISOString(),

        arrivalTime:
          flight.arrival?.scheduled ||
          new Date(date).toISOString(),

        // AviationStack does not provide duration
        duration: null,

        // AviationStack does not provide stop information
        stops: null,

        terminal:
          flight.departure?.terminal ||
          flight.arrival?.terminal ||
          "N/A",

        gate:
          flight.departure?.gate || "N/A",

        status:
          flight.flight_status || "scheduled",

        // Not provided by AviationStack
        seatClass: null,

        note: "Live flight data from AviationStack API",

        score: null,

        departureAirport:
          flight.departure?.iata || from,

        departureAirportName:
          flight.departure?.airport || from,

        arrivalAirport:
          flight.arrival?.iata || to,

        arrivalAirportName:
          flight.arrival?.airport || to,

        airlineIATA:
          flight.airline?.iata || null,

        airlineICAO:
          flight.airline?.icao || null,

        flightDate:
          flight.flight_date || date
      };
    });

    return flights;

  } catch (error) {
    console.error(
      ' ',
      error.message
    );
    console.log("❌ Sky Scrapper API Error, falling back to Mock:");
    return generateMockFlights(from, to, date, travelers);
  }
};

const fetchHotels = async (to, travelers, date, returnDate) => {
  const rapidKey = process.env.BOOKING_API_KEY || process.env.RAPIDAPI_KEY;
  const BOOKING_HOST = 'apidojo-booking-v1.p.rapidapi.com';

  if (!rapidKey) {
    console.log(`🏨 [Mock Hotels] Generating for destination: ${to}`);
    return generateMockHotels(to, travelers);
  }

  // ── Guard: dates must be today or future (API rejects past dates) ─────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let arrivalDate = date;
  if (!arrivalDate || new Date(arrivalDate) < today) {
    arrivalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  let departureDate = returnDate && returnDate !== arrivalDate ? returnDate : null;
  if (!departureDate || new Date(departureDate) <= new Date(arrivalDate)) {
    departureDate = new Date(new Date(arrivalDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  try {
    // ── Step 1: Auto-complete to get city lat/lon from Booking's own index ───
    console.log(`🏨 [Booking.com] Auto-completing "${to}"...`);
    const acRes = await axios.get('https://apidojo-booking-v1.p.rapidapi.com/locations/auto-complete', {
      params: { text: to, languagecode: 'en-us' },
      headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': BOOKING_HOST },
      timeout: 6000
    });

    // auto-complete returns an object whose values are the result array items
    const acItems = Object.values(acRes.data || {});
    if (!acItems.length) throw new Error(`No location found for "${to}"`);

    // Pick the first city-level match (prefer entries that have nr_hotels > 0)
    const loc = acItems.find(i => i.dest_type === 'city' || i.city_name === '') || acItems[0];
    const lat = parseFloat(loc.latitude);
    const lon = parseFloat(loc.longitude);
    console.log(`🏨 [Booking.com] "${to}" → lat:${lat.toFixed(3)} lon:${lon.toFixed(3)} (${loc.nr_hotels} hotels)`);

    // ── Step 2: Build dynamic bounding box (±0.35° ≈ 40 km radius) ──────────
    const delta = 0.35;
    const bbox = [
      (lat - delta).toFixed(6),
      (lat + delta).toFixed(6),
      (lon - delta).toFixed(6),
      (lon + delta).toFixed(6)
    ].join(',');

    console.log(`🏨 [Booking.com] list-by-map bbox:${bbox} | ${arrivalDate}→${departureDate}`);

    // ── Step 3: Search hotels by bounding box ─────────────────────────────────
    const searchRes = await axios.get('https://apidojo-booking-v1.p.rapidapi.com/properties/list-by-map', {
      params: {
        arrival_date: arrivalDate,
        departure_date: departureDate,
        room_qty: 1,
        guest_qty: travelers,
        bbox,
        search_id: 'none',
        languagecode: 'en-us',
        travel_purpose: 'leisure',
        order_by: 'popularity',
        offset: 0,
        price_filter_currencycode: 'INR'
      },
      headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': BOOKING_HOST },
      timeout: 10000
    });

    const rawList = searchRes.data?.result || [];
    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error(`list-by-map returned 0 results for ${to} (code:${searchRes.data?.code})`);
    }

    const hotels = rawList.slice(0, 10).map((hotel, idx) => ({
      id: `HT-BK-${hotel.hotel_id || idx}`,
      type: 'hotel',
      provider: 'Booking.com',
      name: hotel.hotel_name || 'Unknown Hotel',
      price: Math.round(hotel.min_total_price || 3000), // Already in INR
      rating: Number(((hotel.review_score || 8.0) / 2).toFixed(1)) || 4.0,
      distance: parseFloat(String(hotel.distance_to_cc || '2.5').replace(/[^0-9.]/g, '')) || 2.0,
      amenities: ['WiFi', 'AC', 'Breakfast Included'],
      image: hotel.max_photo_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      score: null
    }));

    console.log(`✅ Booking.com: ${hotels.length} hotels found for ${to}`);
    return hotels;

  } catch (error) {
    console.error('❌ Booking.com API Error, falling back to Mock:', error.message);
  }

  return generateMockHotels(to, travelers);
};

const fetchTrains = async (from, to, date, travelers) => {
  const hasRailway = process.env.RAILWAY_API_KEY;

  if (!hasRailway) {
    console.log(`🚂 [Mock Trains] Generating for ${from} -> ${to} on ${date}`);
    return generateMockTrains(from, to, date, travelers);
  }

  try {
    console.log('🚂 [IRCTC RapidAPI] Querying API...');

    const options = {
      method: 'GET',

      url: 'https://irctc1.p.rapidapi.com/api/v3/getLiveStation',

      params: {
        stationCode: from.toUpperCase(),   // Example: SBC, NDLS
        hours: 1
      },

      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': process.env.RAILWAY_API_KEY,
        'x-rapidapi-host': 'irctc1.p.rapidapi.com'
      },

      timeout: 5000
    };

    const res = await axios.request(options);

    const data = res.data?.data;

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No train data found');
    }

    const trains = data.slice(0, 5).map((train, idx) => {
      return {
        id: `TR-IR-${train.train_number || idx}`,

        type: 'train',

        provider: 'IRCTC',

        trainNumber: train.train_number || `TR${idx}`,

        name: train.train_name || 'Unknown Train',

        price: Math.round(400 + Math.random() * 800) * travelers,

        departureTime:
          train.scharr || new Date(date).toISOString(),

        arrivalTime:
          train.schdep ||
          new Date(
            new Date(date).getTime() + 8 * 60 * 60 * 1000
          ).toISOString(),

        duration: 480,

        availability: 'Check Live Status',

        platform: train.platform || 'N/A',

        status: train.current_status || 'On Time'
      };
    });

    return trains;

  } catch (error) {
    console.error(
      '❌ IRCTC API Error, falling back to Mock:',
      error.message
    );
  }

  return generateMockTrains(from, to, date, travelers);
};

const fetchDestination = async (to) => {
  const hasTripadvisor = process.env.TRIPADVISOR_KEY;
  const hasWeatherApi = process.env.WEATHER_API_KEY;

  if (!hasTripadvisor && !hasWeatherApi) {
    console.log(`🗺️  [Mock Destination] Generating for: ${to}`);
    return generateMockDestination(to);
  }

  try {
    console.log('🗺️  [TripAdvisor Destination] Querying TripAdvisor RapidAPI...');
    // Make call to destination API
    const options = {
      method: 'GET',
      // Prefer TripAdvisor if key present, otherwise use WeatherAPI for current weather
      url: process.env.TRIPADVISOR_KEY ? 'https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation' : 'https://weatherapi-com.p.rapidapi.com/current.json',
      params: process.env.TRIPADVISOR_KEY ? { query: to } : { q: to },
      headers: {
        'x-rapidapi-key': process.env.TRIPADVISOR_KEY || process.env.WEATHER_API_KEY || process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.TRIPADVISOR_KEY ? 'tripadvisor16.p.rapidapi.com' : 'weatherapi-com.p.rapidapi.com'
      },
      timeout: 5000
    };
    const res = await axios.request(options);
    const location = res.data?.data?.[0];

    // We fetch weather from OpenWeather if key exists, otherwise static weather
    let weather = { temp: 26, condition: 'Sunny' };
    if (process.env.OPENWEATHER_KEY) {
      try {
        const wRes = await axios.get('https://weatherapi-com.p.rapidapi.com/current.json', {
          params: { q: to },
          headers: { 'x-rapidapi-key': process.env.WEATHER_API_KEY || process.env.RAPIDAPI_KEY, 'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com' },
          timeout: 3000
        });
        weather = {
          temp: Math.round(wRes.data.current.temp_c),
          condition: wRes.data.current.condition.text
        };
      } catch (we) {
        console.warn('Failed to fetch OpenWeather, using default weather');
      }
    }

    if (location) {
      return {
        city: location.name,
        weather,
        places: ['City Center', 'Scenic Views', 'Heritage Museum'],
        crowdLevel: 'Moderate',
        bestSeason: 'November to February',
        safetyScore: 8.8,
        averageCost: 4000
      };
    }
  } catch (error) {
    console.error(' ', error.message);
  }

  return generateMockDestination(to);
};

// Local scoring failover (if Python FastAPI microservice is offline)
const runLocalScoring = (flights, hotels, trains) => {
  console.log('⚖️  Running Javascript Failover Ranking Engine...');

  const minFlightPrice = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 1;
  const minFlightDur = flights.length > 0 ? Math.min(...flights.map(f => f.duration)) : 1;

  const minHotelPrice = hotels.length > 0 ? Math.min(...hotels.map(h => h.price)) : 1;
  const maxHotelRating = hotels.length > 0 ? Math.max(...hotels.map(h => h.rating)) : 5;

  const minTrainPrice = trains.length > 0 ? Math.min(...trains.map(t => t.price)) : 1;
  const minTrainDur = trains.length > 0 ? Math.min(...trains.map(t => t.duration)) : 1;

  // Score Flight
  const scoredFlights = flights.map(f => {
    const priceEff = (minFlightPrice / f.price) * 100;
    const durEff = (minFlightDur / f.duration) * 100;
    const stopPenalty = f.stops * 15;

    const score = Math.round(priceEff * 0.5 + durEff * 0.4 - stopPenalty);
    return { ...f, score: Math.max(10, Math.min(100, score)) };
  });

  // Score Hotels
  const scoredHotels = hotels.map(h => {
    const priceEff = (minHotelPrice / h.price) * 100;
    const ratingEff = (h.rating / 5) * 100;
    const distPenalty = h.distance * 3;

    const score = Math.round(priceEff * 0.5 + ratingEff * 0.4 - distPenalty);
    return { ...h, score: Math.max(10, Math.min(100, score)) };
  });

  // Score Trains
  const scoredTrains = trains.map(t => {
    const priceEff = (minTrainPrice / t.price) * 100;
    const durEff = (minTrainDur / t.duration) * 100;

    const score = Math.round(priceEff * 0.6 + durEff * 0.4);
    return { ...t, score: Math.max(10, Math.min(100, score)) };
  });

  return { flights: scoredFlights, hotels: scoredHotels, trains: scoredTrains };
};

// ── Terminal result reporter (runs after every search) ─────────────────────
const logSearchResults = (from, to, flights, hotels, trains, destination, source) => {
  const div = '═'.repeat(52);
  const dash = '─'.repeat(52);
  const tag = source === 'cache' ? ' [CACHE HIT]' : ' [FRESH FETCH]';

  console.log(`\n${div}`);
  console.log(`   🧭 VoyageIQ — Decision Stack Result${tag}`);
  console.log(`   Route : ${from.toUpperCase()} → ${to.toUpperCase()}`);
  console.log(div);

  // ── Flights ──────────────────────────────────────────────
  console.log(`\n✈️  FLIGHTS  (${flights.length} found)`);
  console.log(dash);
  if (flights.length === 0) {
    console.log('   ⚠️  No flights returned');
  } else {
    flights.slice(0, 3).forEach((f, i) => {
      const score = f.score != null ? `  Score: ${f.score}` : '';
      console.log(`   ${i + 1}. ${(f.carrier || 'Unknown').padEnd(22)} ₹${String(f.price || 0).padStart(7)}  ${f.stops === 0 ? 'Non-stop' : `${f.stops} stop(s)`}${score}`);
    });
    if (flights.length > 3) console.log(`   ... and ${flights.length - 3} more`);
  }

  // ── Hotels ───────────────────────────────────────────────
  console.log(`\n🏨  HOTELS   (${hotels.length} found)`);
  console.log(dash);
  if (hotels.length === 0) {
    console.log('   ⚠️  No hotels returned');
  } else {
    hotels.slice(0, 3).forEach((h, i) => {
      const score = h.score != null ? `  Score: ${h.score}` : '';
      const rating = typeof h.rating === 'number' ? `★${h.rating.toFixed(1)}` : '★?';
      console.log(`   ${i + 1}. ${(h.name || 'Unknown').substring(0, 28).padEnd(28)} ₹${String(h.price || 0).padStart(7)}  ${rating}${score}`);
    });
    if (hotels.length > 3) console.log(`   ... and ${hotels.length - 3} more`);
  }

  // ── Trains ───────────────────────────────────────────────
  console.log(`\n🚂  TRAINS   (${trains.length} found)`);
  console.log(dash);
  if (trains.length === 0) {
    console.log('   ⚠️  No trains returned (route may be international or unavailable)');
  } else {
    trains.slice(0, 3).forEach((t, i) => {
      const score = t.score != null ? `  Score: ${t.score}` : '';
      console.log(`   ${i + 1}. ${(t.name || 'Unknown').substring(0, 28).padEnd(28)} ₹${String(t.price || 0).padStart(7)}  ${t.duration ? Math.floor(t.duration / 60) + 'h' + (t.duration % 60) + 'm' : '?'}${score}`);
    });
    if (trains.length > 3) console.log(`   ... and ${trains.length - 3} more`);
  }

  // ── Destination ──────────────────────────────────────────
  if (destination) {
    console.log(`\n📍  DESTINATION — ${destination.city || to}`);
    console.log(dash);
    console.log(`   Weather    : ${destination.weather?.temp ?? '?'}°C  ${destination.weather?.condition ?? ''}`);
    console.log(`   Safety     : ${destination.safetyScore ?? '?'}/10`);
    console.log(`   Crowd      : ${destination.crowdLevel ?? '?'}`);
    console.log(`   Best Season: ${destination.bestSeason ?? '?'}`);
  }

  console.log(`\n${div}\n`);
};

const searchAll = async (from, to, date, returnDate, travelers, budget) => {
  const queryKey = `${from.toLowerCase()}-${to.toLowerCase()}-${date}-${travelers}`;

  // 1. Check Cache
  const cachedData = await getCache(queryKey);
  if (cachedData) {
    logSearchResults(from, to, cachedData.flights, cachedData.hotels, cachedData.trains, cachedData.destination, 'cache');
    return cachedData;
  }

  // 2. Parallel Fetch
  const fetchPromises = [
    fetchFlights(from, to, date, travelers),
    fetchHotels(to, travelers, date, returnDate),
    fetchTrains(from, to, date, travelers),
    fetchDestination(to)
  ];

  const results = await Promise.allSettled(fetchPromises);

  let flights = results[0].status === 'fulfilled' ? results[0].value : [];
  let hotels = results[1].status === 'fulfilled' ? results[1].value : [];
  let trains = results[2].status === 'fulfilled' ? results[2].value : [];
  const destination = results[3].status === 'fulfilled' ? results[3].value : generateMockDestination(to);

  // 3. Score Options
  // Try sending to Python AI Engine. If it fails, run local JS ranking.
  try {
    console.log('🤖 Sending data to Python AI FastAPI Engine for Ranking...');
    const aiResponse = await axios.post(`${AI_ENGINE_URL}/rank`, {
      flights,
      hotels,
      trains
    }, { timeout: 3000 });

    if (aiResponse.data && aiResponse.data.flights) {
      flights = aiResponse.data.flights;
      hotels = aiResponse.data.hotels;
      trains = aiResponse.data.trains;
      console.log('✅ AI Rankings loaded from Python microservice');
    } else {
      const scored = runLocalScoring(flights, hotels, trains);
      flights = scored.flights;
      hotels = scored.hotels;
      trains = scored.trains;
    }
  } catch (error) {
    console.warn(`⚠️  FastAPI ranking failed (${error.message}). Falling back to local JS scoring.`);
    const scored = runLocalScoring(flights, hotels, trains);
    flights = scored.flights;
    hotels = scored.hotels;
    trains = scored.trains;
  }

  const finalResult = { flights, hotels, trains, destination };

  // 4. Log results to terminal
  logSearchResults(from, to, flights, hotels, trains, destination, 'fresh');

  // 5. Save to Cache
  await setCache(queryKey, finalResult);

  return finalResult;
};

module.exports = {
  searchAll,
  runLocalScoring
};
