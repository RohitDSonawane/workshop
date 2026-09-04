require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./config/db');
const { seedData } = require('./utils/seedData');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize & Seed Database
initDb();
seedData();

// Core Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health Check & Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Event Management System (EMS) Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      events: '/api/v1/events',
      tickets: '/api/v1/tickets',
      analytics: '/api/v1/analytics'
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 EMS Backend Server running on http://localhost:${PORT}`);
  console.log(`=================================================`);
});
