require('dotenv').config();
const axios = require('axios');

const rapidKey = process.env.BOOKING_API_KEY || process.env.RAPIDAPI_KEY;
const HOST = 'apidojo-booking-v1.p.rapidapi.com';

// Future dates (must be today or after)
const arrival   = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
const departure = new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0];
console.log('Using dates:', arrival, '→', departure);

const call = async (path, params) => {
  const res = await axios.get(`https://${HOST}${path}`, {
    params,
    headers: { 'x-rapidapi-key': rapidKey, 'x-rapidapi-host': HOST },
    timeout: 12000
  });
  return res.data;
};

(async () => {
  // ── Test 1: /properties/list-by-map for Goa (real bbox) ──
  console.log('\n── Test: list-by-map for GOA ──');
  try {
    const data = await call('/properties/list-by-map', {
      arrival_date: arrival, departure_date: departure,
      room_qty: 1, guest_qty: 2,
      bbox: '14.9493,15.6493,73.774,74.474',
      search_id: 'none', languagecode: 'en-us',
      travel_purpose: 'leisure', order_by: 'popularity', offset: 0
    });
    const items = data.result || [];
    console.log('  Goa hotels:', items.length);
    items.slice(0, 3).forEach((h, i) => console.log(`  ${i+1}. ${h.hotel_name} | ₹${h.min_total_price} | ★${h.review_score}`));
  } catch(e) { console.log('  FAIL:', e.response?.data || e.message); }

  // ── Test 2: /properties/list-by-map for Mumbai ──
  console.log('\n── Test: list-by-map for MUMBAI ──');
  try {
    const data = await call('/properties/list-by-map', {
      arrival_date: arrival, departure_date: departure,
      room_qty: 1, guest_qty: 2,
      bbox: '18.726,19.426,72.527,73.227',
      search_id: 'none', languagecode: 'en-us',
      travel_purpose: 'leisure', order_by: 'popularity', offset: 0
    });
    const items = data.result || [];
    console.log('  Mumbai hotels:', items.length);
    items.slice(0, 3).forEach((h, i) => console.log(`  ${i+1}. ${h.hotel_name} | ₹${h.min_total_price} | ★${h.review_score}`));
  } catch(e) { console.log('  FAIL:', e.response?.data || e.message); }

  // ── Test 3: /properties/list with dest_id for Goa (from auto-complete) ──
  console.log('\n── Test: /properties/list with dest_id=4127 (Goa) ──');
  try {
    const data = await call('/properties/list', {
      offset: 0, arrival_date: arrival, departure_date: departure,
      room_qty: 1, guest_qty: 2, search_id: 'none',
      dest_ids: -2095829, // Goa, India
      languagecode: 'en-us', travel_purpose: 'leisure', order_by: 'popularity'
    });
    const items = data.result || [];
    console.log('  Goa (dest_id) hotels:', items.length);
    if (items[0]) console.log('  keys:', Object.keys(items[0]).join(', '));
    items.slice(0, 3).forEach((h, i) => console.log(`  ${i+1}. ${h.hotel_name} | price:${h.min_total_price}`));
  } catch(e) { console.log('  FAIL:', e.response?.data?.message || e.message); }
})();
