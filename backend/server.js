require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./cache/cache');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Health Check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to VoyageIQ API Gateway',
    status: 'healthy',
    timestamp: new Date()
  });
});

// Start Server and Connect Database
const startServer = async () => {
  // Attempt DB Connection
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 VoyageIQ Express Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
