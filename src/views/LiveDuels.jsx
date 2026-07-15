import React, { useState, useEffect } from 'react';
import { Swords, Clock, AlertTriangle, CheckCircle, Code2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const LiveDuels = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [activeDuel, setActiveDuel] = useState(null);
  const [matchStatus, setMatchStatus] = useState('lobby'); // lobby, starting, active, finished
  const [countdown, setCountdown] = useState(5);
  const [remainingTime, setRemainingTime] = useState(0);
  const [opponentStatus, setOpponentStatus] = useState('idle');
  const [code, setCode] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [claimantId, setClaimantId] = useState(null);
  
  useEffect(() => {
    if (!socket) return;

    // Challenge accepted: initialize duel
    socket.on('challenge_accepted', (data) => {
      setActiveDuel(data);
      setMatchStatus('starting');
      socket.emit('join_duel', data.id);
    });

    socket.on('duel_countdown', (data) => {
      setCountdown(data.count);
    });

    socket.on('duel_started', (data) => {
      setMatchStatus('active');
      setRemainingTime(activeDuel?.timeLimit * 60 || 30 * 60); // fallback 30 mins
      
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('opponent_submission', (data) => {
      setOpponentStatus(`Submitted - ${data.status}`);
    });

    socket.on('opponent_claimed_victory', (data) => {
      setClaimantId(data.userId);
      setShowConfirmModal(true);
    });

    socket.on('victory_disputed', () => {
      alert("Your opponent disputed your victory claim! Keep coding or sort it out in chat.");
    });

    socket.on('duel_finished', (data) => {
      setMatchStatus('finished');
      setShowConfirmModal(false);
      if (data.winner === user._id) {
        alert('You won the duel! 🎉');
      } else if (data.winner) {
        alert('You lost the duel. Better luck next time! 😢');
      } else {
        alert('Match ended in a draw! 🤝');
      }
    });

    return () => {
      socket.off('challenge_accepted');
      socket.off('duel_countdown');
      socket.off('duel_started');
      socket.off('opponent_submission');
      socket.off('opponent_claimed_victory');
      socket.off('victory_disputed');
      socket.off('duel_finished');
    };
  }, [socket, activeDuel, user]);

  const handleVerify = () => {
    if (!socket || !activeDuel) return;
    
    socket.emit('verify_submission', {
      duelId: activeDuel.id
    });
    
    if (activeDuel.problem.platform !== 'Codeforces') {
      alert('Victory claimed! Waiting for opponent to confirm...');
    }
  };

  const confirmOpponentVictory = () => {
    socket.emit('confirm_opponent_victory', { duelId: activeDuel.id, winnerId: claimantId });
    setShowConfirmModal(false);
  };

  const disputeVictory = () => {
    socket.emit('dispute_victory', { duelId: activeDuel.id, claimantId });
    setShowConfirmModal(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (matchStatus === 'starting') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--accent-primary)', fontWeight: 800 }}>{countdown}</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Get ready! Duel starting soon...</p>
      </div>
    );
  }

  if (matchStatus === 'active' || matchStatus === 'finished') {
    const p1 = activeDuel.players[0];
    const p2 = activeDuel.players[1];
    
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header className="card flex items-center justify-between" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeDuel.problem.title}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Platform: {activeDuel.problem.platform}</div>
            <a href={activeDuel.problem.problemId.startsWith('http') ? activeDuel.problem.problemId : `https://leetcode.com/problems/${activeDuel.problem.problemId}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
              Open Problem
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <img src={p1.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1.username}`} alt={p1.username} style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p1.username}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', fontStyle: 'italic' }}>VS</div>
            <div className="flex flex-col items-center">
              <img src={p2.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2.username}`} alt={p2.username} style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p2.username}</span>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time Remaining</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: remainingTime < 300 ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>
        </header>

        <div className="flex gap-4" style={{ flex: 1, minHeight: 0 }}>
          <div className="card flex flex-col items-center justify-center text-center" style={{ flex: 1 }}>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
              <Code2 size={48} />
            </div>
            <h3 style={{ fontWeight: 600, fontSize: '1.5rem', marginBottom: '1rem' }}>Code on {activeDuel.problem.platform}</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem' }}>
              Both players must solve the problem on the official platform. Once you get an "Accepted" verdict on {activeDuel.problem.platform}, come back here and click Verify!
            </p>
            <button className="btn btn-primary btn-lg" onClick={handleVerify} disabled={matchStatus === 'finished'}>
              <CheckCircle size={20} /> Verify Solution
            </button>
          </div>
        </div>
        
        {showConfirmModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
              <AlertTriangle size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Opponent claims victory!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Did they successfully solve the problem first?</p>
              <div className="flex gap-4 justify-center">
                <button className="btn btn-outline" onClick={disputeVictory}>No, Dispute</button>
                <button className="btn btn-primary" onClick={confirmOpponentVictory}>Yes, Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lobby View
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Duels</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Challenge your friends to real-time coding matches.</p>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
          <Swords size={48} />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ready for a Duel?</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>
          Head over to the <strong>Friends</strong> tab to challenge someone directly, or wait in the lobby to accept incoming challenges!
        </p>
        
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'inline-block' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }}></span>
            Waiting for challenges...
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDuels;
