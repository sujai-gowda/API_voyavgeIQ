import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

export const travelApi = {
  // Aggregated Search (flights, hotels, trains, destination intelligence)
  searchAll: async ({ from, to, date, returnDate, travelers, budget }) => {
    const response = await api.get('/search/all', {
      params: { from, to, date, returnDate, travelers, budget }
    });
    return response.data;
  },

  // Flight search only
  searchFlights: async ({ from, to, date, returnDate, travelers, budget }) => {
    const response = await api.get('/search/flights', {
      params: { from, to, date, returnDate, travelers, budget }
    });
    return response.data;
  },

  // Hotel search only
  searchHotels: async ({ from, to, date, returnDate, travelers, budget }) => {
    const response = await api.get('/search/hotels', {
      params: { from, to, date, returnDate, travelers, budget }
    });
    return response.data;
  },

  // Train search only
  searchTrains: async ({ from, to, date, returnDate, travelers, budget }) => {
    const response = await api.get('/search/trains', {
      params: { from, to, date, returnDate, travelers, budget }
    });
    return response.data;
  },

  // Destination info only
  searchDestination: async ({ from, to, date, returnDate, travelers, budget }) => {
    const response = await api.get('/search/destination', {
      params: { from, to, date, returnDate, travelers, budget }
    });
    return response.data;
  },

  // AI Price Trend Prediction
  predictPriceTrend: async ({ from, to, date, price }) => {
    const response = await api.post('/ai/predict-price-trend', {
      from,
      to,
      date,
      price
    });
    return response.data;
  },

  // AI Budget Packages Recommendation
  getBudgetPlan: async ({ from, to, date, budget, travelers }) => {
    const response = await api.post('/ai/budget-plan', {
      from,
      to,
      date,
      budget,
      travelers
    });
    return response.data;
  },

  // AI Chat Assistant
  sendChatMessage: async (message, history = []) => {
    const response = await api.post('/ai/chat', {
      message,
      history
    });
    return response.data;
  },

  // Cache Administration
  getCacheStats: async () => {
    const response = await api.get('/cache/stats');
    return response.data;
  },

  clearCache: async () => {
    const response = await api.post('/cache/clear');
    return response.data;
  }
};

export default travelApi;
