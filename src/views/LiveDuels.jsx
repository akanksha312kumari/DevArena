import React, { useState } from 'react';
import { Swords, Globe, Users, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

const LiveDuels = () => {
  const [matchState, setMatchState] = useState('lobby'); // lobby or active

  if (matchState === 'active') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Validate Binary Search Tree</h2>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Clock size={16} /> 12:45 remaining
            </div>
          </div>
          <button className="btn btn-outline" onClick={() => setMatchState('lobby')}>Surrender</button>
        </header>

        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', flex: 1, gap: '1.5rem' }}>
          {/* User Side */}
          <div className="card flex flex-col" style={{ border: '2px solid var(--accent-primary)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=tourist_fanboy" alt="You" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ fontWeight: 600 }}>tourist_fanboy (You)</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '8px', padding: '1rem', color: 'var(--text-primary)', fontFamily: 'monospace', marginBottom: '1rem' }}>
              {'// Write your solution here...\n\nfunction isValidBST(root) {\n  \n}'}
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--accent-success)' }}>
              <CheckCircle2 size={18} /> Status: 1/3 test cases passed
            </div>
          </div>

          {/* Opponent Side */}
          <div className="card flex flex-col">
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=algo_queen" alt="Opponent" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ fontWeight: 600 }}>algo_queen</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Code is hidden during duel...
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--accent-streak)' }}>
              <Clock size={18} /> Status: Thinking...
            </div>
          </div>
        </div>

        {/* Chat Box */}
        <div className="card mt-4" style={{ marginTop: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MessageSquare size={20} color="var(--text-muted)" />
          <input type="text" placeholder="Send a message to your opponent..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent' }} />
          <button className="btn btn-primary" style={{ padding: '0.25rem 1rem' }}>Send</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
        <Swords size={48} color="var(--accent-primary)" />
      </div>
      <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Live Matchmaking</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.125rem' }}>
        Test your skills against developers worldwide in real-time coding battles.
      </p>

      <div className="flex flex-col gap-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <button className="btn btn-primary animate-pulse" style={{ padding: '1rem', fontSize: '1.125rem' }} onClick={() => setMatchState('active')}>
          <Globe size={20} /> Find Global Opponent
        </button>
        <button className="btn btn-outline" style={{ padding: '1rem', fontSize: '1.125rem' }}>
          <Users size={20} /> Challenge a Friend
        </button>
      </div>
    </div>
  );
};

export default LiveDuels;
