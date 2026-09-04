// Socket.io /queue namespace handler
let queueNamespace = null;

const initQueueSocket = (io) => {
  queueNamespace = io.of('/queue');

  queueNamespace.on('connection', (socket) => {
    console.log(`[Socket.io /queue] Client connected: ${socket.id}`);

    // Client joins room for specific centre: e.g. "centre_60c72b2f9b1d8b0015b8d234"
    socket.on('join_centre', (centreId) => {
      const room = `centre_${centreId}`;
      socket.join(room);
      console.log(`[Socket.io /queue] Socket ${socket.id} joined ${room}`);
    });

    socket.on('leave_centre', (centreId) => {
      const room = `centre_${centreId}`;
      socket.leave(room);
      console.log(`[Socket.io /queue] Socket ${socket.id} left ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io /queue] Client disconnected: ${socket.id}`);
    });
  });

  return queueNamespace;
};

// Broadcast queue update helper
const broadcastQueueUpdate = (centreId, queueData) => {
  if (queueNamespace) {
    const room = `centre_${centreId}`;
    queueNamespace.to(room).emit('queue_updated', queueData);
    console.log(`[Socket.io /queue] Broadcasted 'queue_updated' to room ${room}`);
  }
};

module.exports = {
  initQueueSocket,
  broadcastQueueUpdate,
  getQueueNamespace: () => queueNamespace,
};
