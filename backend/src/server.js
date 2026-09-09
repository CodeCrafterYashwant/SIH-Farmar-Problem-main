require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

// Setup Socket.io for Phase 5 live queue updates
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Socket.io initialization for Phase 5 live queue updates
const { initQueueSocket } = require('./services/queue.socket');
initQueueSocket(io);

// Attach io to request object for downstream controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${Date.now() - start}ms`);
  });
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const centreRoutes = require('./routes/centreRoutes');
const slotRoutes = require('./routes/slotRoutes');
const staffRoutes = require('./routes/staffRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const queueRoutes = require('./routes/queueRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Phase 0: GET /api/health endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    message: 'SIH26032 Smart Procurement Platform API is active and healthy',
    database: dbConnected ? 'connected' : 'disconnected (configure MONGODB_URI in .env)',
    timestamp: new Date().toISOString(),
    service: 'sih-backend',
    version: '1.0.0',
  });
});

// Database check middleware for API operations requiring database
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database Unavailable',
      message: 'MongoDB is currently disconnected. Please provide a valid MONGODB_URI in backend/.env (e.g. MongoDB Atlas connection string).',
    });
  }
  next();
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Optional initial admin setup endpoint if database has no admin
app.post('/api/setup-admin', async (req, res) => {
  try {
    const { Staff } = require('./models');
    const existingAdmin = await Staff.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'System admin already exists' });
    }
    const admin = new Staff({
      name: req.body.name || 'System Administrator',
      username: (req.body.username || 'admin').toLowerCase(),
      password: req.body.password || 'AdminPass123!',
      role: 'admin',
    });
    await admin.save();
    return res.status(201).json({
      success: true,
      message: 'Initial administrator account created successfully',
      username: admin.username,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Global 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  await connectDB();

  // Auto-provision initial administrator if none exists
  try {
    const { Staff } = require('./models');
    const existingAdmin = await Staff.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const admin = new Staff({
        name: 'System Administrator',
        username: 'admin',
        password: 'AdminPass123!',
        role: 'admin',
      });
      await admin.save();
      console.log('[Auth] Auto-provisioned initial administrator: username `admin` / password `AdminPass123!`');
    }
  } catch (seedErr) {
    console.warn('[Auth] Initial admin provision check warning:', seedErr.message);
  }

  server.listen(PORT, () => {
    console.log(`[Server] SIH26032 Backend running on http://localhost:${PORT}`);
    console.log(`[CORS] Enabled for client: ${allowedOrigin}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, io };
