const axios = require('axios');
const User = require('../models/User');
const Duel = require('../models/Duel');
const gamificationService = require('../services/gamificationService');

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

  socket.on('accept_challenge', async (data) => {
    const { senderId, challengeId, problem, timeLimit } = data;
    const acceptorId = connectedUsers.get(socket.id);
    
    // Fetch user info for UI display
    try {
      const sender = await User.findById(senderId).select('username profile stats platforms');
      const acceptor = await User.findById(acceptorId).select('username profile stats platforms');
      
      const p1 = { id: senderId, username: sender?.username, avatar: sender?.profile?.avatar, platforms: sender?.platforms };
      const p2 = { id: acceptorId, username: acceptor?.username, avatar: acceptor?.profile?.avatar, platforms: acceptor?.platforms };
    
    // Create a new active duel
    const duelId = `duel_${Date.now()}`;
    activeDuels.set(duelId, {
      id: duelId,
      players: [p1, p2],
      problem,
      timeLimit,
      startTime: Date.now() + 3000, // Starts in 3 seconds for 3-2-1
      endTime: Date.now() + 3000 + (timeLimit * 60 * 1000),
      status: 'starting'
    });

    const duelState = activeDuels.get(duelId);

    // Notify both players to transition to duel view
    io.to(senderId).emit('challenge_accepted', duelState);
    io.to(acceptorId).emit('challenge_accepted', duelState);

    // Start server-side authoritative timer
    startDuelTimer(io, duelId);
    } catch (e) {
      console.error('Error accepting challenge:', e);
    }
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

  socket.on('verify_submission', async (data) => {
    const { duelId } = data;
    const userId = connectedUsers.get(socket.id);
    const duel = activeDuels.get(duelId);
    
    if (!duel || duel.status !== 'active') return;

    const playerIndex = duel.players.findIndex(p => p.id === userId);
    if (playerIndex === -1) return;
    const player = duel.players[playerIndex];

    if (duel.problem.platform === 'Codeforces' && player.platforms?.codeforces) {
      try {
        const handle = player.platforms.codeforces;
        const res = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10`);
        if (res.data.status === 'OK') {
          const submissions = res.data.result;
          // Check if any recent submission matches the problem ID and is OK and was submitted after duel start
          // Since we don't have exact strict problemId matching mapping right now, we'll just check if there's a recent OK verdict for simplicity in this prototype.
          const passed = submissions.some(sub => sub.verdict === 'OK' && (sub.creationTimeSeconds * 1000) > duel.startTime);
          
          if (passed) {
            handleDuelWin(io, duel, userId);
            return;
          }
        }
      } catch (e) {
        console.error('Codeforces API error:', e);
      }
    }

    // Fallback: Honor System
    // Broadcast to opponent that user claims victory
    socket.to(duelId).emit('opponent_claimed_victory', { userId });
  });

  socket.on('confirm_opponent_victory', (data) => {
    const { duelId, winnerId } = data;
    const duel = activeDuels.get(duelId);
    if (!duel || duel.status !== 'active') return;
    
    handleDuelWin(io, duel, winnerId);
  });
  
  socket.on('dispute_victory', (data) => {
    const { duelId, claimantId } = data;
    io.to(duelId).emit('victory_disputed', { claimantId });
  });
};

const handleDuelWin = (io, duel, winnerId) => {
  duel.status = 'finished';
  duel.winner = winnerId;
  
  // Persist to MongoDB
  Duel.create({
    players: duel.players.map(p => p.id),
    winner: winnerId,
    problem: duel.problem,
    timeLimit: duel.timeLimit,
    status: 'finished',
    startTime: new Date(duel.startTime),
    endTime: new Date()
  }).catch(err => console.error('Error saving duel to DB:', err));
  
  User.findById(winnerId).then(user => {
    if (user) {
      gamificationService.awardXP(user, 100, 'Won a duel!', 'duel_win');
      gamificationService.updateStreak(user);
      user.save().then(() => {
        io.to(winnerId).emit('xp_awarded', { amount: 100, reason: 'Won a duel!' });
      });
    }
  }).catch(err => console.error('Error awarding XP for duel:', err));
  
  io.to(duel.id).emit('duel_finished', {
    winner: winnerId,
    reason: 'solution_accepted'
  });
  activeDuels.delete(duel.id);
};

function startDuelTimer(io, duelId) {
  const duel = activeDuels.get(duelId);
  if (!duel) return;

  let count = 3;
  const countdownInterval = setInterval(() => {
    if (!activeDuels.has(duelId)) {
      clearInterval(countdownInterval);
      return;
    }
    
    io.to(duelId).emit('duel_countdown', { count });
    count--;

    if (count < 0) {
      clearInterval(countdownInterval);
      
      const activeDuel = activeDuels.get(duelId);
      if (activeDuel) {
        activeDuel.status = 'active';
        io.to(duelId).emit('duel_started', { startTime: Date.now() });

        // Set timeout for end of match
        const remainingTime = activeDuel.endTime - Date.now();
        setTimeout(() => {
          const d = activeDuels.get(duelId);
        if (d && d.status === 'active') {
          d.status = 'finished';
          d.winner = null;
          // Persist draw to MongoDB
          Duel.create({
            players: d.players.map(p => p.id),
            winner: null,
            problem: d.problem,
            timeLimit: d.timeLimit,
            status: 'finished',
            startTime: new Date(d.startTime),
            endTime: new Date()
          }).catch(err => console.error('Error saving draw duel to DB:', err));
          io.to(duelId).emit('duel_finished', { winner: null, reason: 'time_up' });
          activeDuels.delete(duelId);
        }
        }, remainingTime);
      }
    }
  }, 1000);
}
