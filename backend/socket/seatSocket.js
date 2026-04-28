const jwt = require('jsonwebtoken');
const ticketLifecycle = require('../services/ticketLifecycle');
const { isBlacklisted } = require('../controllers/authController');

/**
 * [FIX 6.1] Verify JWT on socket handshake.
 * Client must pass token in socket auth: { auth: { token: "Bearer ..." } }
 */
const authenticateSocket = (socket, next) => {
  const rawToken = socket.handshake.auth?.token;
  const token = rawToken?.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

  if (!token) {
    // Allow unauthenticated connections for public seat-map viewing (read-only)
    // They can join event rooms but their identity will be null
    socket.user = null;
    return next();
  }

  try {
    if (isBlacklisted(token)) {
      return next(new Error('TOKEN_REVOKED'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('TOKEN_INVALID'));
  }
};

module.exports = (io) => {
  ticketLifecycle.setIO(io);

  // [FIX 6.1] Apply auth middleware to all socket connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} user=${socket.user?.id ?? 'guest'}`);

    // [FIX 6.2] Validate eventId: must be a positive integer string/number
    const parseEventId = (eventId) => {
      const id = parseInt(eventId, 10);
      if (!Number.isFinite(id) || id <= 0) return null;
      return id;
    };

    // Join event room for real-time seat updates
    socket.on('join:event', (eventId) => {
      const id = parseEventId(eventId);
      if (!id) {
        console.warn(`⚠️  Invalid eventId from ${socket.id}: ${JSON.stringify(eventId)}`);
        return; // silently drop — don't join garbage rooms
      }
      socket.join(`event:${id}`);
      console.log(`👤 ${socket.id} joined event:${id}`);
    });

    // Leave event room
    socket.on('leave:event', (eventId) => {
      const id = parseEventId(eventId);
      if (!id) return;
      socket.leave(`event:${id}`);
    });

    // Join queue room — requires authentication
    socket.on('join:queue', ({ eventId, userId }) => {
      const eid = parseEventId(eventId);
      // [FIX 6.1] Only let authenticated users join their own queue room
      if (!eid || !socket.user || socket.user.id !== parseInt(userId, 10)) {
        console.warn(`⚠️  Unauthorized join:queue attempt from ${socket.id}`);
        return;
      }
      socket.join(`queue:${eid}:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
