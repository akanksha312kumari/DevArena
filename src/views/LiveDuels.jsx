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
  
  useEffect(() => {
    if (!socket) return;

    // Challenge accepted: initialize duel
    socket.on('challenge_accepted', (data) => {
      setActiveDuel(data);
      setMatchStatus('starting');
      setCountdown(5);
      
      const cd = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(cd);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      socket.emit('join_duel', data.duelId);
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

    socket.on('duel_finished', (data) => {
      setMatchStatus('finished');
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
      socket.off('duel_started');
      socket.off('opponent_submission');
      socket.off('duel_finished');
    };
  }, [socket, activeDuel, user]);

  const handleSubmit = () => {
    if (!socket || !activeDuel) return;
    
    // Simulate compilation and passing logic
    const status = Math.random() > 0.5 ? 'Passed' : 'Failed - Wrong Answer';
    
    socket.emit('submit_code', {
      duelId: activeDuel.duelId,
      status
    });

    if (status === 'Passed') {
      alert('Your solution passed! You won!');
    } else {
      alert(`Submission ${status}`);
    }
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

  if (matchStatus === 'active') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header className="card flex items-center justify-between" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeDuel.problem.title}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Platform: {activeDuel.problem.platform}</div>
          </div>
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Opponent Status</span>
              <span style={{ fontWeight: 600, color: opponentStatus.includes('Passed') ? 'var(--accent-success)' : opponentStatus.includes('Failed') ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                {opponentStatus}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time Remaining</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: remainingTime < 300 ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>
        </header>

        <div className="flex gap-4" style={{ flex: 1, minHeight: 0 }}>
          {/* Problem Description Panel (Mocked) */}
          <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Problem Description</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
              You may assume that each input would have exactly one solution, and you may not use the same element twice.
            </p>
          </div>

          {/* Code Editor Panel */}
          <div className="card flex flex-col" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--card-border)' }}>
              <span style={{ fontWeight: 500 }}>Code Editor</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1, padding: '1rem', background: 'var(--bg-primary)', color: 'var(--text-primary)',
                fontFamily: 'monospace', border: 'none', outline: 'none', resize: 'none'
              }}
              placeholder="Write your solution here..."
            />
            <div className="flex justify-end gap-3" style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', background: 'var(--bg-secondary)' }}>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Play size={16} /> Submit Solution
              </button>
            </div>
          </div>
        </div>
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
