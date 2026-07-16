import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle, Terminal, Trophy, Minus } from 'lucide-react';

const LiveDuelArena = ({ duel, socket, user, onLeave }) => {
  const [code, setCode] = useState('// Write your solution here\nfunction solve() {\n  \n}\n');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [opponentStatus, setOpponentStatus] = useState('Coding...');
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => {
    if (duel && duel.status === 'active') {
      const remaining = Math.max(0, Math.floor((duel.endTime - Date.now()) / 1000));
      setRemainingTime(remaining);
      
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [duel]);

  useEffect(() => {
    if (!socket) return;

    const handleOpponentSub = (data) => {
      setOpponentStatus(`Status: ${data.status}`);
    };

    const handleSubFailed = (data) => {
      setIsSubmitting(false);
      setConsoleOutput(prev => [...prev, { type: 'error', text: data.message || 'Submission failed' }]);
    };

    const handleDuelFinished = (data) => {
      setIsSubmitting(false);
      setMatchResult(data);
    };

    const handlePlayerStatusUpdate = (data) => {
      // Find the player in duel state and update their status (we mutate the local react state by forcing a re-render or updating parent state)
      // Since duel state comes from props, ideally we'd have a local copy of players, but for now we'll just track opponentStatus for 1v1.
      if (!duel.isGroup) {
        setOpponentStatus(data.status);
      }
    };

    socket.on('opponent_submission', handleOpponentSub);
    socket.on('submission_failed', handleSubFailed);
    socket.on('duel_finished', handleDuelFinished);
    socket.on('player_status_update', handlePlayerStatusUpdate);

    return () => {
      socket.off('opponent_submission', handleOpponentSub);
      socket.off('submission_failed', handleSubFailed);
      socket.off('duel_finished', handleDuelFinished);
      socket.off('player_status_update', handlePlayerStatusUpdate);
    };
  }, [socket, duel]);

  const handleSubmit = () => {
    if (isSubmitting || matchResult) return;
    setIsSubmitting(true);
    setConsoleOutput(prev => [...prev, { type: 'info', text: 'Executing code...' }]);
    
    socket.emit('verify_submission', {
      duelId: duel.id,
      code: code
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const p1 = duel?.players[0];
  const p2 = duel?.players[1];
  const isGroup = duel?.isGroup;
  const opponent = p1?.id === user?._id ? p2 : p1;

  // Handle group vs 1v1 header
  const renderHeaderCenter = () => {
    if (isGroup) {
      return (
        <>
          <div className="flex flex-col items-center">
            <img src={user?.profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="You" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.75rem', marginTop: '0.25rem' }}>You</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 1rem' }}>VS</div>
          <div className="flex flex-col items-center justify-center">
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{duel.players.length - 1}</div>
            <span style={{ fontWeight: 600, fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>Others</span>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="flex flex-col items-center">
          <img src={user?.profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="You" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.75rem', marginTop: '0.25rem' }}>You</span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 1rem' }}>VS</div>
        <div className="flex flex-col items-center">
          <img src={opponent?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.username}`} alt={opponent?.username} style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <span style={{ fontWeight: 600, fontSize: '0.75rem', marginTop: '0.25rem' }}>{opponent?.username}</span>
        </div>
        <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opponent Status</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: opponentStatus.includes('Failed') ? 'var(--accent-danger)' : 'var(--text-primary)' }}>{opponentStatus}</div>
        </div>
      </>
    );
  };

  return (
    <div style={{ height: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '-1rem' }}>
      {/* Header */}
      <header className="card flex items-center justify-between" style={{ padding: '0.75rem 1.5rem', marginBottom: 0 }}>
        <div className="flex items-center">
          {renderHeaderCenter()}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time Remaining</span>
            <div className="flex items-center gap-2">
              <Clock size={16} color={remainingTime < 300 ? 'var(--accent-danger)' : 'var(--accent-primary)'} />
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: remainingTime < 300 ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                {formatTime(remainingTime)}
              </span>
            </div>
          </div>
          <button className="btn btn-outline" onClick={onLeave}>Leave</button>
        </div>
      </header>

      {/* Main Split */}
      <div className="flex gap-4" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Pane: Problem Description */}
        <div className="card" style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0 0 1rem 0', borderBottom: '1px solid var(--card-border)', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{duel?.problem?.title || 'Problem'}</h2>
            <div className="flex items-center gap-3" style={{ fontSize: '0.75rem' }}>
              <span style={{ color: duel?.problem?.difficulty === 'Easy' ? 'var(--accent-success)' : duel?.problem?.difficulty === 'Hard' ? 'var(--accent-danger)' : 'var(--accent-streak)', fontWeight: 600 }}>{duel?.problem?.difficulty || 'Medium'}</span>
              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{duel?.problem?.platform || 'leetcode'}</span>
              <a href={duel?.problem?.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>View Original</a>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p><strong>Description:</strong></p>
            <p>Given the constraints of the Live Duel, please read the full problem description on the original platform by clicking the link above.</p>
            <br />
            <p><strong>Rules:</strong></p>
            <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
              <li>Write your solution in the editor on the right.</li>
              <li>Click <strong>Submit Code</strong> when ready.</li>
              <li>First to pass all hidden test cases wins!</li>
              <li>Do not cheat or use AI assistants during the duel.</li>
            </ul>
          </div>
          
          {isGroup && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Live Leaderboard</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                {duel?.players?.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between" style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                    <div className="flex items-center gap-2">
                      <img src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} alt={p.username} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.username} {p.id === user._id && '(You)'}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: p.status === 'Evaluating...' ? 'var(--accent-warning)' : p.status === 'Failed' ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                      {p.status || 'Coding...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor & Console */}
        <div className="flex flex-col gap-4" style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <div className="flex justify-between items-center" style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>main.js</div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.25rem 1rem', fontSize: '0.875rem' }} 
                onClick={handleSubmit}
                disabled={isSubmitting || matchResult}
              >
                {isSubmitting ? 'Running...' : 'Submit Code'}
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={setCode}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 16 }
                }}
              />
            </div>
          </div>

          {/* Console */}
          <div className="card" style={{ height: '200px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--card-border)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={14} /> Console
            </div>
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#1e1e1e', color: '#ccc', fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {consoleOutput.length === 0 ? (
                <span style={{ color: '#666' }}>No output yet. Run your code to see results.</span>
              ) : (
                consoleOutput.map((out, i) => (
                  <div key={i} style={{ color: out.type === 'error' ? '#f87171' : out.type === 'success' ? '#4ade80' : '#ccc', marginBottom: '0.25rem' }}>
                    {out.type === 'error' ? '✖ ' : out.type === 'success' ? '✔ ' : 'ℹ '}
                    {out.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match Result Modal */}
      {matchResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            {matchResult.winner === user._id ? (
              <>
                <Trophy size={48} color="var(--accent-success)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-success)', marginBottom: '0.5rem' }}>Victory!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You solved the problem first!</p>
              </>
            ) : matchResult.winner ? (
              <>
                <XCircle size={48} color="var(--accent-danger)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>Defeat</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your opponent solved it first.</p>
              </>
            ) : (
              <>
                <Minus size={48} color="var(--accent-warning)" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-warning)', marginBottom: '0.5rem' }}>Draw</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Time ran out.</p>
              </>
            )}
            <button className="btn btn-primary w-full" onClick={onLeave}>Return to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDuelArena;
