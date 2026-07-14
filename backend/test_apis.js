/**
 * VoyageIQ — API Key Health Check
 * Run: node test_apis.js
 */
require('dotenv').config();
const axios = require('axios');

const pass = (name) => console.log(`\n✅ [PASS] ${name}`);
const fail = (name, msg) => console.log(`\n❌ [FAIL] ${name}\n   Reason: ${msg}`);
const info = (msg) => console.log(`   ℹ️  ${msg}`);

const run = async () => {
  console.log('═══════════════════════════════════════════');
  console.log('   VoyageIQ — API Key Health Check');
  console.log('═══════════════════════════════════════════');

  // ── 1. Aviationstack ──────────────────────────────────────
  console.log('\n🔍 Testing Aviationstack...');
  if (!process.env.AVIATIONSTACK_KEY) {
    fail('Aviationstack', 'AVIATIONSTACK_KEY not set in .env');
  } else {
    try {
      const res = await axios.get('http://api.aviationstack.com/v1/flights', {
        params: {
          access_key: process.env.AVIATIONSTACK_KEY,
          dep_iata: 'BOM',
          arr_iata: 'DEL',
          limit: 2
        },
        timeout: 8000
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        pass('Aviationstack');
        info(`Returned ${res.data.data.length} flight(s) for BOM→DEL`);
        if (res.data.data[0]) {
          const f = res.data.data[0];
          info(`Sample: ${f.airline?.name || 'Unknown'} ${f.flight?.iata || ''} | Status: ${f.flight_status}`);
        }
      } else if (res.data?.error) {
        fail('Aviationstack', `API Error: ${res.data.error.info || JSON.stringify(res.data.error)}`);
      } else {
        fail('Aviationstack', 'No data returned — possibly no flights for today on this route');
        info('Try checking https://aviationstack.com/dashboard for usage');
      }
    } catch (e) {
      fail('Aviationstack', e.message);
    }
  }

  // ── 2. RapidAPI — Booking.com (Hotels) ───────────────────
  console.log('\n🔍 Testing Booking.com (via RapidAPI)...');
  const rapidKey = process.env.BOOKING_API_KEY || process.env.RAPIDAPI_KEY;
  if (!rapidKey) {
    fail('Booking.com (RapidAPI)', 'RAPIDAPI_KEY not set in .env');
  } else {
    try {
      const res = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/locations', {
        params: { name: 'Goa', locale: 'en-gb' },
        headers: {
          'x-rapidapi-key': rapidKey,
          'x-rapidapi-host': 'booking-com.p.rapidapi.com'
        },
        timeout: 8000
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        pass('Booking.com (RapidAPI)');
        info(`Found location: "${res.data[0]?.name}" (dest_id: ${res.data[0]?.dest_id})`);
      } else {
        fail('Booking.com (RapidAPI)', 'Empty response — check if you subscribed to Booking.com API on RapidAPI');
      }
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message;
      if (status === 403) fail('Booking.com (RapidAPI)', '403 Forbidden — You need to SUBSCRIBE to this API on RapidAPI first');
      else if (status === 429) fail('Booking.com (RapidAPI)', '429 Rate limit exceeded');
      else fail('Booking.com (RapidAPI)', `${status || ''} ${msg}`);
    }
  }

  // ── 3. RapidAPI — IRCTC (Trains) ─────────────────────────
  console.log('\n🔍 Testing IRCTC Indian Railways (via RapidAPI)...');
  const trainKey = process.env.RAILWAY_API_KEY;
  if (!trainKey) {
    fail('IRCTC (RapidAPI)', 'RAILWAY_API_KEY not set in .env');
  } else {
    try {
      const res = await axios.get('https://irctc1.p.rapidapi.com/api/v1/searchTrain', {
        params: { query: 'Mumbai' },
        headers: {
          'x-rapidapi-key': trainKey,
          'x-rapidapi-host': 'irctc1.p.rapidapi.com'
        },
        timeout: 8000
      });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        pass('IRCTC (RapidAPI)');
        info(`Found ${res.data.data.length} trains. Sample: ${res.data.data[0]?.train_name} (${res.data.data[0]?.train_number})`);
      } else {
        fail('IRCTC (RapidAPI)', 'Empty data — check if you subscribed to IRCTC API on RapidAPI');
      }
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message;
      if (status === 403) fail('IRCTC (RapidAPI)', '403 Forbidden — Subscribe to IRCTC1 API on RapidAPI first');
      else if (status === 429) fail('IRCTC (RapidAPI)', '429 Rate limit exceeded');
      else fail('IRCTC (RapidAPI)', `${status || ''} ${msg}`);
    }
  }

  // ── 4. RapidAPI — TripAdvisor (Destinations) ─────────────
  console.log('\n🔍 Testing TripAdvisor (via RapidAPI)...');
  const taKey = process.env.TRIPADVISOR_KEY || process.env.RAPIDAPI_KEY;
  if (!taKey) {
    fail('TripAdvisor (RapidAPI)', 'TRIPADVISOR_KEY not set in .env');
  } else {
    try {
      const res = await axios.get('https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation', {
        params: { query: 'Goa' },
        headers: {
          'x-rapidapi-key': taKey,
          'x-rapidapi-host': 'tripadvisor16.p.rapidapi.com'
        },
        timeout: 8000
      });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        pass('TripAdvisor (RapidAPI)');
        info(`Found: "${res.data.data[0]?.name}" (${res.data.data[0]?.geoId})`);
      } else {
        fail('TripAdvisor (RapidAPI)', 'Empty response — check RapidAPI subscription');
      }
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message;
      if (status === 403) fail('TripAdvisor (RapidAPI)', '403 Forbidden — Subscribe to TripAdvisor16 API on RapidAPI first');
      else if (status === 429) fail('TripAdvisor (RapidAPI)', '429 Rate limit exceeded');
      else fail('TripAdvisor (RapidAPI)', `${status || ''} ${msg}`);
    }
  }

  // ── 5. Gemini AI ─────────────────────────────────────────
  console.log('\n🔍 Testing Gemini AI...');
  if (!process.env.GEMINI_API_KEY) {
    fail('Gemini AI', 'GEMINI_API_KEY not set in .env');
  } else {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: 'Say hello in one word.' }] }] },
        { timeout: 8000 }
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        pass('Gemini AI');
        info(`Response: "${text.trim()}"`);
      } else {
        fail('Gemini AI', 'No text returned');
      }
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.error?.message || e.message;
      if (status === 400) fail('Gemini AI', `Bad request: ${msg}`);
      else if (status === 403) fail('Gemini AI', `403 Invalid API key or API not enabled: ${msg}`);
      else fail('Gemini AI', `${status || ''} ${msg}`);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('   Health Check Complete');
  console.log('═══════════════════════════════════════════\n');
};

run().catch(console.error);
