module.exports = (io, socket, connectedUsers) => {
  // Join a specific room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    // Broadcast to room that a user joined
    const userId = connectedUsers.get(socket.id);
    if (userId) {
      socket.to(roomId).emit('room_notification', {
        type: 'USER_JOINED',
        userId,
        roomId,
        message: 'A user joined the room'
      });
    }
  });

  // Leave a specific room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Handle incoming chat messages
  socket.on('send_message', (data) => {
    const { roomId, message, senderId, senderName, timestamp } = data;
    // Broadcast message to all other clients in the room
    socket.to(roomId).emit('receive_message', {
      roomId,
      message,
      senderId,
      senderName,
      timestamp: timestamp || new Date()
    });
  });

  // Typing indicators
  socket.on('typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user_stop_typing', { username });
  });
};
