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

    // Send the list of online user IDs in this room to everyone
    broadcastOnlineMembers(io, roomId, connectedUsers);
  });

  // Leave a specific room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
    
    // Send updated list of online user IDs
    broadcastOnlineMembers(io, roomId, connectedUsers);
  });

  socket.on('disconnect', () => {
    // When a user disconnects, their sockets leave the rooms automatically,
    // but we can't easily broadcast to specific rooms here. We could iterate rooms they were in.
    // Let's rely on leave_room for explicit leaves, or polling.
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

function broadcastOnlineMembers(io, roomId, connectedUsers) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  if (!roomSockets) return;
  
  const onlineUserIds = new Set();
  for (const socketId of roomSockets) {
    const uid = connectedUsers.get(socketId);
    if (uid) onlineUserIds.add(uid);
  }
  
  io.to(roomId).emit('online_members_update', Array.from(onlineUserIds));
}
