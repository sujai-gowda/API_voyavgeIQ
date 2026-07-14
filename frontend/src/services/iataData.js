/**
 * IATA Airport Code Lookup Database
 * Covers all major Indian cities + top world tourist destinations.
 * Format: { cityName (lowercase key) : { iata, city, country, airport } }
 */

export const IATA_DB = {
  // ─── INDIA — Metros ───────────────────────────────────────────────
  delhi: { iata: 'DEL', city: 'Delhi', country: 'India', airport: 'Indira Gandhi International' },
  'new delhi': { iata: 'DEL', city: 'New Delhi', country: 'India', airport: 'Indira Gandhi International' },
  mumbai: { iata: 'BOM', city: 'Mumbai', country: 'India', airport: 'Chhatrapati Shivaji Maharaj International' },
  bombay: { iata: 'BOM', city: 'Mumbai', country: 'India', airport: 'Chhatrapati Shivaji Maharaj International' },
  bangalore: { iata: 'BLR', city: 'Bangalore', country: 'India', airport: 'Kempegowda International' },
  bengaluru: { iata: 'BLR', city: 'Bengaluru', country: 'India', airport: 'Kempegowda International' },
  chennai: { iata: 'MAA', city: 'Chennai', country: 'India', airport: 'Chennai International' },
  madras: { iata: 'MAA', city: 'Chennai', country: 'India', airport: 'Chennai International' },
  kolkata: { iata: 'CCU', city: 'Kolkata', country: 'India', airport: 'Netaji Subhas Chandra Bose International' },
  calcutta: { iata: 'CCU', city: 'Kolkata', country: 'India', airport: 'Netaji Subhas Chandra Bose International' },
  hyderabad: { iata: 'HYD', city: 'Hyderabad', country: 'India', airport: 'Rajiv Gandhi International' },
  pune: { iata: 'PNQ', city: 'Pune', country: 'India', airport: 'Pune Airport' },
  ahmedabad: { iata: 'AMD', city: 'Ahmedabad', country: 'India', airport: 'Sardar Vallabhbhai Patel International' },
  kochi: { iata: 'COK', city: 'Kochi', country: 'India', airport: 'Cochin International' },
  cochin: { iata: 'COK', city: 'Kochi', country: 'India', airport: 'Cochin International' },
  jaipur: { iata: 'JAI', city: 'Jaipur', country: 'India', airport: 'Jaipur International' },
  lucknow: { iata: 'LKO', city: 'Lucknow', country: 'India', airport: 'Chaudhary Charan Singh International' },
  chandigarh: { iata: 'IXC', city: 'Chandigarh', country: 'India', airport: 'Chandigarh International' },
  guwahati: { iata: 'GAU', city: 'Guwahati', country: 'India', airport: 'Lokpriya Gopinath Bordoloi International' },
  bhopal: { iata: 'BHO', city: 'Bhopal', country: 'India', airport: 'Raja Bhoj Airport' },
  patna: { iata: 'PAT', city: 'Patna', country: 'India', airport: 'Jay Prakash Narayan International' },
  raipur: { iata: 'RPR', city: 'Raipur', country: 'India', airport: 'Swami Vivekananda Airport' },
  indore: { iata: 'IDR', city: 'Indore', country: 'India', airport: 'Devi Ahilya Bai Holkar Airport' },
  nagpur: { iata: 'NAG', city: 'Nagpur', country: 'India', airport: 'Dr. Babasaheb Ambedkar International' },
  surat: { iata: 'STV', city: 'Surat', country: 'India', airport: 'Surat Airport' },
  vadodara: { iata: 'BDQ', city: 'Vadodara', country: 'India', airport: 'Vadodara Airport' },
  visakhapatnam: { iata: 'VTZ', city: 'Visakhapatnam', country: 'India', airport: 'Visakhapatnam Airport' },
  vizag: { iata: 'VTZ', city: 'Visakhapatnam', country: 'India', airport: 'Visakhapatnam Airport' },
  coimbatore: { iata: 'CJB', city: 'Coimbatore', country: 'India', airport: 'Coimbatore International' },
  tiruchirappalli: { iata: 'TRZ', city: 'Tiruchirappalli', country: 'India', airport: 'Tiruchirappalli International' },
  trichy: { iata: 'TRZ', city: 'Tiruchirappalli', country: 'India', airport: 'Tiruchirappalli International' },
  madurai: { iata: 'IXM', city: 'Madurai', country: 'India', airport: 'Madurai Airport' },
  thiruvananthapuram: { iata: 'TRV', city: 'Thiruvananthapuram', country: 'India', airport: 'Trivandrum International' },
  trivandrum: { iata: 'TRV', city: 'Thiruvananthapuram', country: 'India', airport: 'Trivandrum International' },
  calicut: { iata: 'CCJ', city: 'Kozhikode', country: 'India', airport: 'Calicut International' },
  kozhikode: { iata: 'CCJ', city: 'Kozhikode', country: 'India', airport: 'Calicut International' },

  // ─── INDIA — Tourist Spots ────────────────────────────────────────
  goa: { iata: 'GOI', city: 'Goa', country: 'India', airport: 'Goa International (Mopa)' },
  agra: { iata: 'AGR', city: 'Agra', country: 'India', airport: 'Agra Airport' },
  varanasi: { iata: 'VNS', city: 'Varanasi', country: 'India', airport: 'Lal Bahadur Shastri International' },
  amritsar: { iata: 'ATQ', city: 'Amritsar', country: 'India', airport: 'Sri Guru Ram Dass Jee International' },
  udaipur: { iata: 'UDR', city: 'Udaipur', country: 'India', airport: 'Maharana Pratap Airport' },
  jodhpur: { iata: 'JDH', city: 'Jodhpur', country: 'India', airport: 'Jodhpur Airport' },
  manali: { iata: 'KUU', city: 'Manali', country: 'India', airport: 'Kullu-Manali Airport' },
  shimla: { iata: 'SLV', city: 'Shimla', country: 'India', airport: 'Shimla Airport' },
  dehradun: { iata: 'DED', city: 'Dehradun', country: 'India', airport: 'Jolly Grant Airport' },
  leh: { iata: 'IXL', city: 'Leh', country: 'India', airport: 'Kushok Bakula Rimpochhe Airport' },
  ladakh: { iata: 'IXL', city: 'Leh / Ladakh', country: 'India', airport: 'Kushok Bakula Rimpochhe Airport' },
  srinagar: { iata: 'SXR', city: 'Srinagar', country: 'India', airport: 'Sheikh ul-Alam International' },
  jammu: { iata: 'IXJ', city: 'Jammu', country: 'India', airport: 'Jammu Airport' },
  ranchi: { iata: 'IXR', city: 'Ranchi', country: 'India', airport: 'Birsa Munda Airport' },
  bhubaneswar: { iata: 'BBI', city: 'Bhubaneswar', country: 'India', airport: 'Biju Patnaik International' },
  'port blair': { iata: 'IXZ', city: 'Port Blair', country: 'India', airport: 'Veer Savarkar International' },
  andaman: { iata: 'IXZ', city: 'Port Blair', country: 'India', airport: 'Veer Savarkar International' },
  dibrugarh: { iata: 'DIB', city: 'Dibrugarh', country: 'India', airport: 'Dibrugarh Airport' },
  imphal: { iata: 'IMF', city: 'Imphal', country: 'India', airport: 'Bir Tikendrajit International' },
  agartala: { iata: 'IXA', city: 'Agartala', country: 'India', airport: 'Maharaja Bir Bikram Airport' },
  aurangabad: { iata: 'IXU', city: 'Aurangabad', country: 'India', airport: 'Aurangabad Airport' },

  // ─── WORLD — Asia ─────────────────────────────────────────────────
  dubai: { iata: 'DXB', city: 'Dubai', country: 'UAE', airport: 'Dubai International' },
  'abu dhabi': { iata: 'AUH', city: 'Abu Dhabi', country: 'UAE', airport: 'Abu Dhabi International' },
  singapore: { iata: 'SIN', city: 'Singapore', country: 'Singapore', airport: 'Singapore Changi' },
  bangkok: { iata: 'BKK', city: 'Bangkok', country: 'Thailand', airport: 'Suvarnabhumi' },
  phuket: { iata: 'HKT', city: 'Phuket', country: 'Thailand', airport: 'Phuket International' },
  'kuala lumpur': { iata: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', airport: 'Kuala Lumpur International' },
  tokyo: { iata: 'NRT', city: 'Tokyo', country: 'Japan', airport: 'Narita International' },
  osaka: { iata: 'KIX', city: 'Osaka', country: 'Japan', airport: 'Kansai International' },
  bali: { iata: 'DPS', city: 'Bali', country: 'Indonesia', airport: 'Ngurah Rai International' },
  jakarta: { iata: 'CGK', city: 'Jakarta', country: 'Indonesia', airport: 'Soekarno-Hatta International' },
  'hong kong': { iata: 'HKG', city: 'Hong Kong', country: 'Hong Kong', airport: 'Hong Kong International' },
  beijing: { iata: 'PEK', city: 'Beijing', country: 'China', airport: 'Beijing Capital International' },
  shanghai: { iata: 'PVG', city: 'Shanghai', country: 'China', airport: 'Shanghai Pudong International' },
  seoul: { iata: 'ICN', city: 'Seoul', country: 'South Korea', airport: 'Incheon International' },
  colombo: { iata: 'CMB', city: 'Colombo', country: 'Sri Lanka', airport: 'Bandaranaike International' },
  kathmandu: { iata: 'KTM', city: 'Kathmandu', country: 'Nepal', airport: 'Tribhuvan International' },
  dhaka: { iata: 'DAC', city: 'Dhaka', country: 'Bangladesh', airport: 'Hazrat Shahjalal International' },
  karachi: { iata: 'KHI', city: 'Karachi', country: 'Pakistan', airport: 'Jinnah International' },
  doha: { iata: 'DOH', city: 'Doha', country: 'Qatar', airport: 'Hamad International' },
  muscat: { iata: 'MCT', city: 'Muscat', country: 'Oman', airport: 'Muscat International' },
  riyadh: { iata: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', airport: 'King Khalid International' },
  jeddah: { iata: 'JED', city: 'Jeddah', country: 'Saudi Arabia', airport: 'King Abdulaziz International' },
  'tel aviv': { iata: 'TLV', city: 'Tel Aviv', country: 'Israel', airport: 'Ben Gurion International' },
  istanbul: { iata: 'IST', city: 'Istanbul', country: 'Turkey', airport: 'Istanbul Airport' },
  taipei: { iata: 'TPE', city: 'Taipei', country: 'Taiwan', airport: 'Taiwan Taoyuan International' },
  hanoi: { iata: 'HAN', city: 'Hanoi', country: 'Vietnam', airport: 'Noi Bai International' },
  'ho chi minh': { iata: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', airport: 'Tan Son Nhat International' },
  'ho chi minh city': { iata: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', airport: 'Tan Son Nhat International' },
  manila: { iata: 'MNL', city: 'Manila', country: 'Philippines', airport: 'Ninoy Aquino International' },
  yangon: { iata: 'RGN', city: 'Yangon', country: 'Myanmar', airport: 'Yangon International' },
  male: { iata: 'MLE', city: 'Malé', country: 'Maldives', airport: 'Velana International' },
  maldives: { iata: 'MLE', city: 'Malé', country: 'Maldives', airport: 'Velana International' },

  // ─── WORLD — Europe ────────────────────────────────────────────────
  london: { iata: 'LHR', city: 'London', country: 'UK', airport: 'Heathrow' },
  paris: { iata: 'CDG', city: 'Paris', country: 'France', airport: 'Charles de Gaulle' },
  amsterdam: { iata: 'AMS', city: 'Amsterdam', country: 'Netherlands', airport: 'Schiphol' },
  frankfurt: { iata: 'FRA', city: 'Frankfurt', country: 'Germany', airport: 'Frankfurt Airport' },
  berlin: { iata: 'BER', city: 'Berlin', country: 'Germany', airport: 'Berlin Brandenburg' },
  rome: { iata: 'FCO', city: 'Rome', country: 'Italy', airport: 'Leonardo da Vinci' },
  madrid: { iata: 'MAD', city: 'Madrid', country: 'Spain', airport: 'Adolfo Suárez Madrid-Barajas' },
  barcelona: { iata: 'BCN', city: 'Barcelona', country: 'Spain', airport: 'Barcelona El Prat' },
  zurich: { iata: 'ZRH', city: 'Zurich', country: 'Switzerland', airport: 'Zurich Airport' },
  vienna: { iata: 'VIE', city: 'Vienna', country: 'Austria', airport: 'Vienna International' },
  prague: { iata: 'PRG', city: 'Prague', country: 'Czech Rep.', airport: 'Václav Havel Airport' },
  budapest: { iata: 'BUD', city: 'Budapest', country: 'Hungary', airport: 'Budapest Ferenc Liszt' },
  athens: { iata: 'ATH', city: 'Athens', country: 'Greece', airport: 'Athens International' },
  lisbon: { iata: 'LIS', city: 'Lisbon', country: 'Portugal', airport: 'Humberto Delgado Airport' },
  brussels: { iata: 'BRU', city: 'Brussels', country: 'Belgium', airport: 'Brussels Airport' },
  copenhagen: { iata: 'CPH', city: 'Copenhagen', country: 'Denmark', airport: 'Copenhagen Airport' },
  stockholm: { iata: 'ARN', city: 'Stockholm', country: 'Sweden', airport: 'Stockholm Arlanda' },
  oslo: { iata: 'OSL', city: 'Oslo', country: 'Norway', airport: 'Oslo Gardermoen' },
  helsinki: { iata: 'HEL', city: 'Helsinki', country: 'Finland', airport: 'Helsinki-Vantaa' },
  moscow: { iata: 'SVO', city: 'Moscow', country: 'Russia', airport: 'Sheremetyevo International' },
  milan: { iata: 'MXP', city: 'Milan', country: 'Italy', airport: 'Milan Malpensa' },
  venice: { iata: 'VCE', city: 'Venice', country: 'Italy', airport: 'Venice Marco Polo' },
  dublin: { iata: 'DUB', city: 'Dublin', country: 'Ireland', airport: 'Dublin Airport' },
  edinburgh: { iata: 'EDI', city: 'Edinburgh', country: 'UK', airport: 'Edinburgh Airport' },

  // ─── WORLD — Americas ────────────────────────────────────────────
  'new york': { iata: 'JFK', city: 'New York', country: 'USA', airport: 'John F. Kennedy International' },
  'new york city': { iata: 'JFK', city: 'New York', country: 'USA', airport: 'John F. Kennedy International' },
  nyc: { iata: 'JFK', city: 'New York', country: 'USA', airport: 'John F. Kennedy International' },
  'los angeles': { iata: 'LAX', city: 'Los Angeles', country: 'USA', airport: 'Los Angeles International' },
  chicago: { iata: 'ORD', city: 'Chicago', country: 'USA', airport: "O'Hare International" },
  'san francisco': { iata: 'SFO', city: 'San Francisco', country: 'USA', airport: 'San Francisco International' },
  miami: { iata: 'MIA', city: 'Miami', country: 'USA', airport: 'Miami International' },
  toronto: { iata: 'YYZ', city: 'Toronto', country: 'Canada', airport: 'Toronto Pearson International' },
  vancouver: { iata: 'YVR', city: 'Vancouver', country: 'Canada', airport: 'Vancouver International' },
  'sao paulo': { iata: 'GRU', city: 'São Paulo', country: 'Brazil', airport: 'São Paulo/Guarulhos International' },
  'rio de janeiro': { iata: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', airport: 'Galeão International' },
  cancun: { iata: 'CUN', city: 'Cancún', country: 'Mexico', airport: 'Cancún International' },
  'mexico city': { iata: 'MEX', city: 'Mexico City', country: 'Mexico', airport: 'Benito Juárez International' },

  // ─── WORLD — Africa & Oceania ────────────────────────────────────
  sydney: { iata: 'SYD', city: 'Sydney', country: 'Australia', airport: 'Sydney Kingsford Smith' },
  melbourne: { iata: 'MEL', city: 'Melbourne', country: 'Australia', airport: 'Melbourne Airport' },
  'cape town': { iata: 'CPT', city: 'Cape Town', country: 'South Africa', airport: 'Cape Town International' },
  johannesburg: { iata: 'JNB', city: 'Johannesburg', country: 'South Africa', airport: 'O.R. Tambo International' },
  nairobi: { iata: 'NBO', city: 'Nairobi', country: 'Kenya', airport: 'Jomo Kenyatta International' },
  cairo: { iata: 'CAI', city: 'Cairo', country: 'Egypt', airport: 'Cairo International' },
  casablanca: { iata: 'CMN', city: 'Casablanca', country: 'Morocco', airport: 'Mohammed V International' },
  auckland: { iata: 'AKL', city: 'Auckland', country: 'New Zealand', airport: 'Auckland Airport' },
};

/**
 * Converts a city name / IATA code string to its IATA code.
 * - If the input is already a valid 3-letter IATA code, returns it as-is (uppercase).
 * - Otherwise looks up the city name in the database.
 * - Returns null if not found.
 *
 * @param {string} input  - City name or IATA code typed by user
 * @returns {{ iata: string, city: string, country: string, airport: string } | null}
 */
export function lookupIATA(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Already a 3-letter IATA code
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    // Verify it exists in DB
    const found = Object.values(IATA_DB).find(v => v.iata === upper);
    return found || { iata: upper, city: upper, country: '', airport: '' };
  }

  // Look up by city name (case-insensitive)
  const key = trimmed.toLowerCase();
  return IATA_DB[key] || null;
}

/**
 * Returns all cities/airports whose name starts with the given query string.
 * Used for autocomplete suggestions.
 *
 * @param {string} query
 * @returns {Array<{ iata, city, country, airport }>}
 */
export function searchIATA(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();

  const results = [];
  const seen = new Set();

  for (const [key, val] of Object.entries(IATA_DB)) {
    if (
      (key.startsWith(q) ||
        val.city.toLowerCase().startsWith(q) ||
        val.iata.toLowerCase().startsWith(q)) &&
      !seen.has(val.iata)
    ) {
      seen.add(val.iata);
      results.push(val);
    }
  }

  // Secondary pass: contains match (lower priority)
  for (const [key, val] of Object.entries(IATA_DB)) {
    if (
      (key.includes(q) || val.city.toLowerCase().includes(q)) &&
      !seen.has(val.iata)
    ) {
      seen.add(val.iata);
      results.push(val);
    }
  }

  return results.slice(0, 8); // max 8 suggestions
}
