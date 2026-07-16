import React, { useState, useEffect } from 'react';
import { Swords, Clock, AlertTriangle, CheckCircle, Code2, Trophy, XCircle, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LiveDuelArena from './LiveDuelArena';

const LiveDuels = ({ initialDuelData }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [activeDuel, setActiveDuel] = useState(initialDuelData || null);
  const [matchStatus, setMatchStatus] = useState(initialDuelData ? 'starting' : 'lobby'); // lobby, starting, active, finished
  const [countdown, setCountdown] = useState(5);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [claimantId, setClaimantId] = useState(null);
  const [duelHistory, setDuelHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch duel history from backend
  const fetchDuelHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/duels/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDuelHistory(data.duels || []);
      }
    } catch (e) {
      console.error('Failed to fetch duel history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchDuelHistory();
  }, []);
  
  useEffect(() => {
    if (initialDuelData) {
      if (socket) socket.emit('join_duel', initialDuelData.id);
      
      if (!activeDuel || activeDuel.id !== initialDuelData.id) {
        setActiveDuel(initialDuelData);
        setMatchStatus('starting');
      }
    }
  }, [initialDuelData, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('duel_state_update', (data) => {
      setActiveDuel(data);
      setMatchStatus(data.status);
      if (data.status === 'active') {
        setRemainingTime(Math.max(0, Math.floor((data.endTime - Date.now()) / 1000)));
      }
    });

    socket.on('duel_countdown', (data) => {
      setCountdown(data.count);
    });

    socket.on('duel_started', (data) => {
      setMatchStatus('active');
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
        // Handled by Arena UI, but we refresh history
      }
      fetchDuelHistory();
    });

    return () => {
      socket.off('duel_state_update');
      socket.off('duel_countdown');
      socket.off('duel_started');
      socket.off('opponent_claimed_victory');
      socket.off('victory_disputed');
      socket.off('duel_finished');
    };
  }, [socket, activeDuel, user]);

  const handleVerify = () => {
    // Only used for honor system logic if fallback needed
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

  const handleLeaveDuel = () => {
    setMatchStatus('lobby');
    setActiveDuel(null);
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
    return <LiveDuelArena duel={activeDuel} socket={socket} user={user} onLeave={handleLeaveDuel} />;
  }

  // Lobby View
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Live Duels</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Challenge your friends to real-time coding matches.</p>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          <Swords size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ready for a Duel?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
          Head over to the <strong>Friends</strong> tab to challenge someone directly, or wait in the lobby to accept incoming challenges!
        </p>
        
        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'inline-block' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }}></span>
            Waiting for challenges...
          </div>
        </div>
      </div>

      {/* Duel History */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={18} style={{ color: 'var(--accent-primary)' }} />
          Match History
        </h3>

        {historyLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Loading history...</div>
        ) : duelHistory.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            No duels played yet. Challenge a friend to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {duelHistory.map((duel, i) => {
              const isWin = duel.winner && duel.winner._id === user._id;
              const isDraw = !duel.winner;
              const opponents = duel.players?.filter(p => p._id !== user._id) || [];
              const opponent = opponents[0];
              const durationMins = duel.timeLimit;
              const date = new Date(duel.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div key={duel._id || i} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
                  borderLeft: `4px solid ${isWin ? 'var(--accent-success)' : isDraw ? 'var(--accent-warning)' : 'var(--accent-danger)'}`
                }}>
                  {/* Result badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: isWin ? 'rgba(34,197,94,0.12)' : isDraw ? 'rgba(217,119,6,0.12)' : 'rgba(239,68,68,0.12)',
                    color: isWin ? 'var(--accent-success)' : isDraw ? 'var(--accent-warning)' : 'var(--accent-danger)'
                  }}>
                    {isWin ? <Trophy size={18} /> : isDraw ? <Minus size={18} /> : <XCircle size={18} />}
                  </div>

                  {/* Problem info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {duel.problem?.title || 'Unknown Problem'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize' }}>{duel.problem?.platform}</span>
                      {duel.problem?.difficulty && <span style={{
                        color: duel.problem.difficulty === 'Easy' ? 'var(--accent-success)' : duel.problem.difficulty === 'Hard' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                      }}>{duel.problem.difficulty}</span>}
                      <span><Clock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {durationMins} min</span>
                    </div>
                  </div>

                  {/* Opponent */}
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {opponents.length > 1 ? (
                        <span>{opponents.length} Others</span>
                      ) : (
                        <>
                          <img src={opponent?.profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.username}`}
                            alt={opponent?.username} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                          <span>{opponent?.username || 'Unknown'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Result label + date */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.85rem',
                      color: isWin ? 'var(--accent-success)' : isDraw ? 'var(--accent-warning)' : 'var(--accent-danger)'
                    }}>
                      {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDuels;
