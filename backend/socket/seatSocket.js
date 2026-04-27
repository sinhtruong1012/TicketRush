const ticketLifecycle = require('../services/ticketLifecycle');

module.exports = (io) => {
  // Pass io to ticket lifecycle for broadcasting
  ticketLifecycle.setIO(io);

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join event room for real-time seat updates
    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`👤 ${socket.id} joined event:${eventId}`);
    });

    // Leave event room
    socket.on('leave:event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    // Join queue room for queue notifications
    socket.on('join:queue', ({ eventId, userId }) => {
      socket.join(`queue:${eventId}:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
