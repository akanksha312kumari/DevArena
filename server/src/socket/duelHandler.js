// Store active matches in memory (in a production app, use Redis)
const activeDuels = new Map(); // duelId -> duel state

module.exports = (io, socket, connectedUsers) => {
  // --- Challenge Logic ---
  socket.on('send_challenge', (data) => {
    const { targetUserId, problem, timeLimit } = data;
    const senderId = connectedUsers.get(socket.id);
    
    // Notify the target user (if they are online and authenticated)
    io.to(targetUserId).emit('challenge_received', {
      senderId,
      problem,
      timeLimit,
      challengeId: `chal_${Date.now()}` // Basic unique ID for the challenge
    });
  });

  socket.on('accept_challenge', (data) => {
    const { senderId, challengeId, problem, timeLimit } = data;
    const acceptorId = connectedUsers.get(socket.id);
    
    // Create a new active duel
    const duelId = `duel_${Date.now()}`;
    activeDuels.set(duelId, {
      id: duelId,
      players: [senderId, acceptorId],
      problem,
      timeLimit,
      startTime: Date.now() + 5000, // Starts in 5 seconds
      endTime: Date.now() + 5000 + (timeLimit * 60 * 1000),
      status: 'starting'
    });

    // Notify both players to transition to duel view
    io.to(senderId).emit('challenge_accepted', { duelId, problem, timeLimit });
    io.to(acceptorId).emit('challenge_accepted', { duelId, problem, timeLimit });

    // Start server-side authoritative timer
    startDuelTimer(io, duelId);
  });

  socket.on('reject_challenge', (data) => {
    const { senderId } = data;
    io.to(senderId).emit('challenge_rejected', {
      message: 'Your challenge was declined.'
    });
  });

  // --- Live Duel Logic ---
  socket.on('join_duel', (duelId) => {
    socket.join(duelId);
    console.log(`Socket ${socket.id} joined duel ${duelId}`);
    
    // Send current state if exists
    const duel = activeDuels.get(duelId);
    if (duel) {
      socket.emit('duel_state_update', duel);
    }
  });

  socket.on('submit_code', (data) => {
    const { duelId, status } = data; // status: 'Passed', 'Failed', etc.
    const userId = connectedUsers.get(socket.id);
    
    const duel = activeDuels.get(duelId);
    if (!duel || duel.status !== 'active') return;

    // Broadcast submission update to opponent
    socket.to(duelId).emit('opponent_submission', {
      userId,
      status,
      timestamp: Date.now()
    });

    if (status === 'Passed') {
      // End duel, user wins
      duel.status = 'finished';
      duel.winner = userId;
      
      io.to(duelId).emit('duel_finished', {
        winner: userId,
        reason: 'solution_accepted'
      });
      activeDuels.delete(duelId);
    }
  });
};

function startDuelTimer(io, duelId) {
  const duel = activeDuels.get(duelId);
  if (!duel) return;

  // Wait 5 seconds for start
  setTimeout(() => {
    if (activeDuels.has(duelId)) {
      const activeDuel = activeDuels.get(duelId);
      activeDuel.status = 'active';
      io.to(duelId).emit('duel_started', { startTime: Date.now() });

      // Set timeout for end of match
      const remainingTime = activeDuel.endTime - Date.now();
      setTimeout(() => {
        const d = activeDuels.get(duelId);
        if (d && d.status === 'active') {
          d.status = 'finished';
          d.winner = null; // Draw
          io.to(duelId).emit('duel_finished', { winner: null, reason: 'time_up' });
          activeDuels.delete(duelId);
        }
      }, remainingTime);
    }
  }, 5000);
}
