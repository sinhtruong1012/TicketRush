require('dotenv').config();

// [FIX 1.4] Fail-fast: crash immediately if critical env vars are missing.
// jwt.sign/verify with secret=undefined accepts ANY token → catastrophic security hole.
const REQUIRED_ENV = [
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_HOST',
];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:');
  missingEnv.forEach(key => console.error(`   - ${key}`));
  console.error('👉 Copy .env.example → .env and fill in all values.');
  process.exit(1);
}

// Extra guard: JWT_SECRET must be strong enough (min 32 chars)
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET is too short (minimum 32 characters required).');
  console.error('   Use a cryptographically random string, e.g.:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// [FIX 1.3] Global rate limiter — safety net for all API routes
const { apiLimiter } = require('./middlewares/rateLimiter');
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// [FIX 26/27] Expose business constants to frontend — single source of truth
const { MAX_SEATS_PER_ORDER, SEAT_LOCK_TIMEOUT_MINUTES } = require('./config/constants');
app.get('/api/config', (req, res) => {
  res.json({ MAX_SEATS_PER_ORDER, SEAT_LOCK_TIMEOUT_MINUTES });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const seatRoutes = require('./routes/seatRoutes');
const orderRoutes = require('./routes/orderRoutes');
const queueRoutes = require('./routes/queueRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO connection
require('./socket/seatSocket')(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

// Services
const ticketLifecycle = require('./services/ticketLifecycle');

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // [FIX 10.1] Never run alter:true in production — it can DROP columns and lose data.
    // In dev: alter:true adds new columns safely.
    // In prod: sync() with no options only creates missing tables, never alters.
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Models synced (dev mode — alter:true)');
    } else {
      await sequelize.sync();
      console.log('✅ Models synced (production mode — safe, no alter)');
    }

    // Start cron jobs
    ticketLifecycle.start();
    console.log('✅ Ticket lifecycle cron started');

    server.listen(PORT, () => {
      console.log(`🚀 TicketRush API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
