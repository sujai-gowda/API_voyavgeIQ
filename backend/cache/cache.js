const mongoose = require('mongoose');

// In-memory cache fallback when MongoDB is disabled or unavailable
const inMemoryCache = new Map();
const inMemoryExpiry = new Map();

// Connect to MongoDB
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ No MONGODB_URI provided in .env. Running with In-Memory Caching.');
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Cache Database');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️ Falling back to In-Memory Caching due to database connection failure.');
    return false;
  }
};

// Search Cache Schema
let SearchCache = null;
try {
  const searchCacheSchema = new mongoose.Schema({
    queryKey: { type: String, required: true, unique: true },
    flights: { type: Array, default: [] },
    hotels: { type: Array, default: [] },
    trains: { type: Array, default: [] },
    destination: { type: Object, default: {} },
    createdAt: { type: Date, expires: 600, default: Date.now } // 10 minutes TTL
  });

  SearchCache = mongoose.model('SearchCache', searchCacheSchema);
} catch (err) {
  console.error('Error defining Mongoose model', err);
}

// Caching Helper Functions
const getCache = async (queryKey) => {
  // Try MongoDB if connected
  if (mongoose.connection.readyState === 1 && SearchCache) {
    try {
      const cached = await SearchCache.findOne({ queryKey });
      if (cached) {
        console.log(`💾 Cache HIT (MongoDB) for query: ${queryKey}`);
        return {
          flights: cached.flights,
          hotels: cached.hotels,
          trains: cached.trains,
          destination: cached.destination
        };
      }
    } catch (error) {
      console.error('Error reading from MongoDB Cache:', error);
    }
  }

  // Fallback to In-Memory Cache
  if (inMemoryCache.has(queryKey)) {
    const expiry = inMemoryExpiry.get(queryKey);
    if (expiry && expiry > Date.now()) {
      console.log(`💾 Cache HIT (In-Memory) for query: ${queryKey}`);
      return inMemoryCache.get(queryKey);
    } else {
      // Clean up expired item
      inMemoryCache.delete(queryKey);
      inMemoryExpiry.delete(queryKey);
    }
  }

  console.log(`💾 Cache MISS for query: ${queryKey}`);
  return null;
};

const setCache = async (queryKey, data) => {
  // Try MongoDB if connected
  if (mongoose.connection.readyState === 1 && SearchCache) {
    try {
      // Upsert the query cache
      await SearchCache.findOneAndUpdate(
        { queryKey },
        { ...data, createdAt: new Date() },
        { upsert: true, new: true }
      );
      console.log(`💾 Saved to MongoDB Cache: ${queryKey}`);
      return;
    } catch (error) {
      console.error('Error writing to MongoDB Cache:', error);
    }
  }

  // Save to In-Memory Cache (expires in 10 minutes)
  inMemoryCache.set(queryKey, data);
  inMemoryExpiry.set(queryKey, Date.now() + 10 * 60 * 1000); // 10 minutes
  console.log(`💾 Saved to In-Memory Cache: ${queryKey}`);
};

const clearCache = async () => {
  if (mongoose.connection.readyState === 1 && SearchCache) {
    try {
      await SearchCache.deleteMany({});
      console.log('🧹 MongoDB cache cleared.');
    } catch (error) {
      console.error('Error clearing MongoDB Cache:', error);
    }
  }
  inMemoryCache.clear();
  inMemoryExpiry.clear();
  console.log('🧹 In-Memory cache cleared.');
};

const getCacheStats = async () => {
  let mongoCount = 0;
  if (mongoose.connection.readyState === 1 && SearchCache) {
    try {
      mongoCount = await SearchCache.countDocuments({});
    } catch (err) { }
  }
  return {
    mongodbConnected: mongoose.connection.readyState === 1,
    mongoCacheItems: mongoCount,
    inMemoryCacheItems: inMemoryCache.size
  };
};

module.exports = {
  connectDB,
  getCache,
  setCache,
  clearCache,
  getCacheStats
};
