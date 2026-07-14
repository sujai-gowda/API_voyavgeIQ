// Data Normalization and Mock Travel Data Generation Layer

// 1. Data Normalizers
const normalizeFlight = (raw, provider = 'Amadeus') => {
  return {
    id: raw.id || `FL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    type: 'flight',
    provider,
    carrier: raw.carrier || raw.airline || 'Unknown Airline',
    flightNumber: raw.flightNumber || 'XX-000',
    price: Math.round(Number(raw.price)),
    departureTime: raw.departureTime || new Date().toISOString(),
    arrivalTime: raw.arrivalTime || new Date().toISOString(),
    duration: Math.round(Number(raw.duration)), // in minutes
    stops: Math.round(Number(raw.stops || 0)),
    seatClass: raw.seatClass || 'Economy',
    score: null
  };
};

const normalizeHotel = (raw, provider = 'Booking.com') => {
  return {
    id: raw.id || `HT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    type: 'hotel',
    provider,
    name: raw.name || 'Cozy Lodge',
    price: Math.round(Number(raw.price)),
    rating: Number(raw.rating || 4.0),
    distance: Number(raw.distance || 2.0), // distance to center in km
    amenities: Array.isArray(raw.amenities) ? raw.amenities : ['WiFi', 'Air Conditioning'],
    image: raw.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    score: null
  };
};

const normalizeTrain = (raw, provider = 'IRCTC') => {
  return {
    id: raw.id || `TR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    type: 'train',
    provider,
    trainNumber: raw.trainNumber || '00000',
    name: raw.name || 'Express Train',
    price: Math.round(Number(raw.price)),
    departureTime: raw.departureTime || new Date().toISOString(),
    arrivalTime: raw.arrivalTime || new Date().toISOString(),
    duration: Math.round(Number(raw.duration)), // in minutes
    availability: raw.availability || 'Available',
    score: null
  };
};

const normalizeDestination = (raw, city) => {
  return {
    city: city || raw.city || 'Destination Info',
    weather: raw.weather || { temp: 25, condition: 'Sunny' },
    places: Array.isArray(raw.places) ? raw.places : ['City Center', 'Local Markets'],
    crowdLevel: raw.crowdLevel || 'Moderate',
    bestSeason: raw.bestSeason || 'October to March',
    safetyScore: Number(raw.safetyScore || 8.0),
    averageCost: Math.round(Number(raw.averageCost || 3000))
  };
};

// 2. High-fidelity Mock Generators (used if real APIs are not configured)
const getAirlinesForRoute = (from, to) => {
  const isIntl = ['tokyo', 'dubai', 'paris', 'singapore'].includes(to.toLowerCase()) || 
                 ['tokyo', 'dubai', 'paris', 'singapore'].includes(from.toLowerCase());
  if (isIntl) {
    return [
      { name: 'Emirates', code: 'EK' },
      { name: 'Singapore Airlines', code: 'SQ' },
      { name: 'Japan Airlines', code: 'JL' },
      { name: 'Air France', code: 'AF' },
      { name: 'Air India', code: 'AI' }
    ];
  } else {
    return [
      { name: 'IndiGo', code: '6E' },
      { name: 'Air India', code: 'AI' },
      { name: 'Vistara', code: 'UK' },
      { name: 'Akasa Air', code: 'QP' },
      { name: 'SpiceJet', code: 'SG' }
    ];
  }
};

const generateMockFlights = (from, to, date, travelers = 1) => {
  const airlines = getAirlinesForRoute(from, to);
  const flights = [];
  const baseDate = new Date(date || Date.now());

  airlines.forEach((airline, index) => {
    // Generate 2 flights per airline with varying times/prices
    for (let i = 0; i < 2; i++) {
      const departureHour = 6 + index * 3 + i * 2;
      const depDate = new Date(baseDate);
      depDate.setHours(departureHour % 24, Math.floor(Math.random() * 4) * 15, 0);

      // Duration: domestic ~120-180m, intl ~300-600m
      const isIntl = ['tokyo', 'dubai', 'paris', 'singapore'].includes(to.toLowerCase()) || 
                     ['tokyo', 'dubai', 'paris', 'singapore'].includes(from.toLowerCase());
      const duration = isIntl ? 360 + (index * 45) : 120 + (index * 15);
      
      const arrDate = new Date(depDate.getTime() + duration * 60 * 1000);
      const stops = isIntl ? (index % 2 === 0 ? 0 : 1) : 0;
      
      // Base prices: domestic ₹4,000 - ₹9,000, international ₹25,000 - ₹65,000
      let basePrice = isIntl ? 25000 + (index * 8000) + (i * 4000) : 3800 + (index * 1100) + (i * 600);
      
      // Adjust price for travelers
      const price = basePrice * travelers;

      flights.push(normalizeFlight({
        id: `FL-${airline.code}-${100 + index * 10 + i}-${Math.floor(baseDate.getTime() / 10000000)}`,
        carrier: airline.name,
        flightNumber: `${airline.code}-${100 + index * 10 + i}`,
        price,
        departureTime: depDate.toISOString(),
        arrivalTime: arrDate.toISOString(),
        duration,
        stops,
        seatClass: i === 1 && index % 2 === 0 ? 'Business' : 'Economy'
      }, 'Skyscanner'));
    }
  });

  return flights.sort((a, b) => a.price - b.price);
};

const hotelDb = {
  goa: [
    { name: 'Taj Exotica Resort & Spa', rating: 4.8, distance: 4.2, amenities: ['Pool', 'Beach Access', 'Spa', 'WiFi', 'Bar'], price: 12000, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cidade de Goa', rating: 4.3, distance: 1.5, amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant'], price: 5500, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' },
    { name: 'Goan Heritage Hotel', rating: 4.0, distance: 0.8, amenities: ['WiFi', 'Pool', 'Breakfast Included'], price: 3200, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' }
  ],
  tokyo: [
    { name: 'Park Hyatt Tokyo', rating: 4.9, distance: 1.2, amenities: ['Spa', 'Sky Bar', 'Pool', 'WiFi', 'Gym'], price: 42000, image: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?auto=format&fit=crop&w=800&q=80' },
    { name: 'Shinjuku Prince Hotel', rating: 4.2, distance: 0.2, amenities: ['WiFi', 'Restaurant', 'Metro Connection'], price: 9500, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80' },
    { name: 'Capsule Hotel Anshin Oyado', rating: 4.5, distance: 0.5, amenities: ['Sauna', 'WiFi', 'Shared Bath'], price: 3500, image: 'https://images.unsplash.com/photo-1506059612708-99d6c258190e?auto=format&fit=crop&w=800&q=80' }
  ],
  dubai: [
    { name: 'Burj Al Arab Jumeirah', rating: 5.0, distance: 8.5, amenities: ['Private Beach', 'Butler Service', 'Pool', 'Helipad', 'Spa'], price: 85000, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Atlantis The Palm', rating: 4.7, distance: 12.0, amenities: ['Waterpark Access', 'Aquarium', 'Pool', 'Spa', 'WiFi'], price: 28000, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80' },
    { name: 'Rove Downtown Dubai', rating: 4.4, distance: 0.6, amenities: ['WiFi', 'Pool', 'Gym', 'Cinema'], price: 48000, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80' }
  ],
  paris: [
    { name: 'The Ritz Paris', rating: 4.9, distance: 0.5, amenities: ['Spa', 'Indoor Pool', 'Garden', 'WiFi', 'Bar'], price: 75000, image: 'https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hotel Regina Louvre', rating: 4.5, distance: 0.3, amenities: ['WiFi', 'Bar', 'Eiffel View', 'Restaurant'], price: 22000, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80' },
    { name: 'Generator Hostel Paris', rating: 4.1, distance: 3.5, amenities: ['Rooftop Bar', 'WiFi', 'Laundry', 'Cafe'], price: 4200, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80' }
  ],
  singapore: [
    { name: 'Marina Bay Sands', rating: 4.8, distance: 1.1, amenities: ['Infinity Pool', 'Casino', 'Spa', 'Rooftop Bar', 'WiFi'], price: 38000, image: 'https://images.unsplash.com/photo-1525596667371-29400c51576f?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hotel Boss', rating: 4.1, distance: 2.1, amenities: ['WiFi', 'Pool', 'Gym', 'Convenience Store'], price: 6500, image: 'https://images.unsplash.com/photo-1549294413-26f195afcbbe?auto=format&fit=crop&w=800&q=80' },
    { name: 'Pod Boutique Capsule Hotel', rating: 4.4, distance: 1.0, amenities: ['Free Breakfast', 'WiFi', 'Personal Lockers'], price: 3000, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80' }
  ],
  default: [
    { name: 'Grand Palace Hotel', rating: 4.5, distance: 1.0, amenities: ['Pool', 'WiFi', 'Gym', 'Restaurant'], price: 6500, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' },
    { name: 'Central Inn', rating: 4.1, distance: 0.5, amenities: ['WiFi', 'Breakfast Included'], price: 3500, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80' },
    { name: 'Budget Stay Apartments', rating: 3.9, distance: 2.5, amenities: ['Kitchenette', 'WiFi', 'Laundry'], price: 2200, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80' }
  ]
};

const generateMockHotels = (destination, travelers = 1) => {
  const cityKey = destination.toLowerCase().trim();
  const rawHotels = hotelDb[cityKey] || hotelDb.default;
  
  return rawHotels.map((hotel, index) => {
    // scale price slightly by travelers, or keep as room price (usually room price is constant up to 2, we scale slightly if > 2)
    const factor = travelers > 2 ? 1 + (travelers - 2) * 0.3 : 1;
    const finalPrice = Math.round(hotel.price * factor);

    return normalizeHotel({
      id: `HT-${cityKey.substr(0,3).toUpperCase()}-${100 + index}-${Math.floor(Math.random() * 1000)}`,
      name: hotel.name,
      price: finalPrice,
      rating: hotel.rating,
      distance: hotel.distance,
      amenities: hotel.amenities,
      image: hotel.image
    }, 'Booking.com');
  });
};

const generateMockTrains = (from, to, date, travelers = 1) => {
  const isIntl = ['tokyo', 'dubai', 'paris', 'singapore'].includes(to.toLowerCase()) || 
                 ['tokyo', 'dubai', 'paris', 'singapore'].includes(from.toLowerCase());
  
  // Trains are generally domestic, return empty or limited if international destination
  if (isIntl) {
    return [];
  }

  const trainTypes = [
    { name: 'Vande Bharat Express', speed: 100, baseFare: 1600, code: '22436' },
    { name: 'Rajdhani Express', speed: 120, baseFare: 2200, code: '12424' },
    { name: 'Shatabdi Express', speed: 140, baseFare: 1100, code: '12002' },
    { name: 'Kerala Express', speed: 180, baseFare: 750, code: '12626' }
  ];

  const baseDate = new Date(date || Date.now());
  const trains = [];

  trainTypes.forEach((train, index) => {
    const departureHour = 6 + index * 4;
    const depDate = new Date(baseDate);
    depDate.setHours(departureHour % 24, 0, 0);

    // Duration: Train takes ~3x to 6x longer than flight (flights take ~150 mins)
    const duration = 300 + index * 180;
    const arrDate = new Date(depDate.getTime() + duration * 60 * 1000);

    const avails = ['Available (12)', 'Available (43)', 'RAC 5', 'WL 8', 'Available (2)'];
    const availability = avails[index % avails.length];

    trains.push(normalizeTrain({
      id: `TR-${train.code}-${Math.floor(baseDate.getTime() / 10000000)}`,
      trainNumber: train.code,
      name: train.name,
      price: train.baseFare * travelers,
      departureTime: depDate.toISOString(),
      arrivalTime: arrDate.toISOString(),
      duration,
      availability
    }, 'IRCTC'));
  });

  return trains.sort((a, b) => a.price - b.price);
};

const destDb = {
  goa: {
    weather: { temp: 29, condition: 'Sunny' },
    places: ['Baga Beach', 'Basilica of Bom Jesus', 'Dudhsagar Falls', 'Anjuna Flea Market'],
    crowdLevel: 'High',
    bestSeason: 'November to February',
    safetyScore: 9.0,
    averageCost: 4500
  },
  tokyo: {
    weather: { temp: 18, condition: 'Clear' },
    places: ['Senso-ji Temple', 'Shibuya Crossing', 'Tokyo Skytree', 'Meiji Shrine'],
    crowdLevel: 'Very High',
    bestSeason: 'March to May (Cherry Blossom) & October to November',
    safetyScore: 9.8,
    averageCost: 15000
  },
  dubai: {
    weather: { temp: 36, condition: 'Hot / Sunny' },
    places: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Desert Safari'],
    crowdLevel: 'High',
    bestSeason: 'November to March',
    safetyScore: 9.5,
    averageCost: 12000
  },
  paris: {
    weather: { temp: 20, condition: 'Partly Cloudy' },
    places: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral', 'Champs-Élysées'],
    crowdLevel: 'Very High',
    bestSeason: 'April to June & October to November',
    safetyScore: 8.2,
    averageCost: 14000
  },
  singapore: {
    weather: { temp: 31, condition: 'Humid / Rain' },
    places: ['Gardens by the Bay', 'Marina Bay Sands', 'Sentosa Island', 'Universal Studios'],
    crowdLevel: 'High',
    bestSeason: 'February to April',
    safetyScore: 9.7,
    averageCost: 11000
  },
  default: {
    weather: { temp: 24, condition: 'Pleasant' },
    places: ['City Museum', 'Botanical Gardens', 'Historic Downtown', 'Main Shopping Street'],
    crowdLevel: 'Moderate',
    bestSeason: 'September to April',
    safetyScore: 8.5,
    averageCost: 5000
  }
};

const generateMockDestination = (destination) => {
  const cityKey = destination.toLowerCase().trim();
  const rawDest = destDb[cityKey] || destDb.default;
  // format city name nicely
  const cityName = destination.charAt(0).toUpperCase() + destination.slice(1).toLowerCase();
  return normalizeDestination(rawDest, cityName);
};

module.exports = {
  normalizeFlight,
  normalizeHotel,
  normalizeTrain,
  normalizeDestination,
  generateMockFlights,
  generateMockHotels,
  generateMockTrains,
  generateMockDestination
};
