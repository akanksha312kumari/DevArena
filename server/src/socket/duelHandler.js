const axios = require('axios');
const User = require('../models/User');
const Duel = require('../models/Duel');
const gamificationService = require('../services/gamificationService');
const platformService = require('../services/platformService');

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
    
    try {
      const sender = await User.findById(senderId).select('username profile stats platforms');
      const acceptor = await User.findById(acceptorId).select('username profile stats platforms');
      
      const p1 = { id: senderId, username: sender?.username, avatar: sender?.profile?.avatar, platforms: sender?.platforms };
      const p2 = { id: acceptorId, username: acceptor?.username, avatar: acceptor?.profile?.avatar, platforms: acceptor?.platforms };
    
      const duelId = `duel_${Date.now()}`;
      activeDuels.set(duelId, {
        id: duelId,
        players: [p1, p2],
        problem,
        timeLimit: timeLimit || 15,
        status: 'starting',
        startTime: Date.now() + 3000,
        endTime: Date.now() + 3000 + ((timeLimit || 15) * 60 * 1000)
      });

      const duelState = activeDuels.get(duelId);

      io.to(senderId).emit('challenge_accepted', duelState);
      io.to(acceptorId).emit('challenge_accepted', duelState);

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
    const { duelId, code } = data;
    const userId = connectedUsers.get(socket.id);
    const duel = activeDuels.get(duelId);
    
    if (!duel || duel.status !== 'active') return;

    const playerIndex = duel.players.findIndex(p => p.id === userId);
    if (playerIndex === -1) return;

    // Simulate mock execution for prototype
    io.to(duelId).emit('opponent_submission', { status: 'Evaluating...' });
    
    setTimeout(() => {
      // Simulate random pass/fail for demo (70% pass rate)
      const passed = Math.random() > 0.3;
      if (passed) {
        handleDuelWin(io, duel, userId);
      } else {
        socket.emit('submission_failed', { message: 'Wrong Answer on Test Case 3.' });
        socket.to(duelId).emit('opponent_submission', { status: 'Failed' });
      }
    }, 2000);
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

function recordActivity(user, problem, result) {
  const dateStr = new Date().toISOString().split('T')[0];
  
  if (!user.platformStats) user.platformStats = {};
  if (!user.platformStats.devarena) {
    user.platformStats.devarena = { heatmapData: new Map(), recentSubmissions: [] };
  }
  
  const daStats = user.platformStats.devarena;
  if (!daStats.heatmapData) daStats.heatmapData = new Map();
  daStats.heatmapData.set(dateStr, (daStats.heatmapData.get(dateStr) || 0) + 1);

  if (!daStats.recentSubmissions) daStats.recentSubmissions = [];
  daStats.recentSubmissions.unshift({
    platform: 'devarena',
    title: `${problem?.title || 'Unknown Problem'} (Duel ${result})`,
    difficulty: problem?.difficulty || 'Custom',
    url: problem?.url || problem?.problemId || '',
    timestamp: new Date()
  });
  if (daStats.recentSubmissions.length > 20) daStats.recentSubmissions.pop();
  
  // Mark modified for nested Mongoose properties
  user.markModified('platformStats.devarena.heatmapData');
  user.markModified('platformStats.devarena.recentSubmissions');
  user.markModified('platformStats');

  // Recalculate global stats to instantly reflect this new activity
  platformService.recalculateGlobalStats(user);
  
  user.markModified('heatmapData');
  user.markModified('recentSubmissions');
}

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
  
  const loserId = duel.players.find(p => p.id !== winnerId)?.id;

  // Update Winner
  User.findById(winnerId).then(user => {
    if (user) {
      user.stats = user.stats || {};
      user.stats.duels = user.stats.duels || { total: 0, wins: 0, losses: 0 };
      user.stats.duels.total += 1;
      user.stats.duels.wins += 1;
      
      const winRate = user.stats.duels.wins / user.stats.duels.total;
      if (user.stats.duels.wins >= 10 && winRate > 0.8) user.stats.arenaRank = 'Grandmaster';
      else if (user.stats.duels.wins >= 5 && winRate > 0.6) user.stats.arenaRank = 'Master';
      else if (user.stats.duels.wins >= 1) user.stats.arenaRank = 'Challenger';

      recordActivity(user, duel.problem, 'Win');

      gamificationService.awardXP(user, 100, 'Won a duel!', 'duel_win');
      gamificationService.updateStreak(user);
      user.save().then(() => {
        io.to(winnerId).emit('xp_awarded', { amount: 100, reason: 'Won a duel!' });
      });
    }
  }).catch(err => console.error('Error updating winner stats:', err));

  // Update Loser
  if (loserId) {
    User.findById(loserId).then(user => {
      if (user) {
        user.stats = user.stats || {};
        user.stats.duels = user.stats.duels || { total: 0, wins: 0, losses: 0 };
        user.stats.duels.total += 1;
        user.stats.duels.losses += 1;
        
        recordActivity(user, duel.problem, 'Loss');
        
        user.save();
      }
    }).catch(err => console.error('Error updating loser stats:', err));
  }
  
  io.to(duel.id).emit('duel_finished', {
    winner: winnerId,
    reason: 'solution_accepted'
  });
  activeDuels.delete(duel.id);
};

function startDuel(io, duelId, problem) {
  const duel = activeDuels.get(duelId);
  if (!duel) return;
  
  duel.problem = problem;
  duel.status = 'starting';
  duel.startTime = Date.now() + 3000;
  duel.endTime = duel.startTime + (duel.timeLimit * 60 * 1000);
  
  io.to(duelId).emit('duel_state_update', duel);
  startDuelTimer(io, duelId);
}

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
          Duel.create({
            players: d.players.map(p => p.id),
            winner: null,
            problem: d.problem,
            timeLimit: d.timeLimit,
            status: 'finished',
            startTime: new Date(d.startTime),
            endTime: new Date()
          }).catch(err => console.error('Error saving draw duel to DB:', err));
          
          // Update both players for draw
          d.players.forEach(p => {
            User.findById(p.id).then(user => {
              if (user) {
                user.stats = user.stats || {};
                user.stats.duels = user.stats.duels || { total: 0, wins: 0, losses: 0 };
                user.stats.duels.total += 1;
                recordActivity(user, d.problem, 'Draw');
                user.save();
              }
            }).catch(e => console.error('Error updating draw stats:', e));
          });

          io.to(duelId).emit('duel_finished', { winner: null, reason: 'time_up' });
          activeDuels.delete(duelId);
        }
        }, remainingTime);
      }
    }
  }, 1000);
}
