import React, { useState } from 'react';
import { Trophy, Code2, Flame } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, handle: 'tourist_fanboy', country: 'US', rating: 2150, streak: 42, isCurrentUser: true },
  { rank: 2, handle: 'algo_queen', country: 'IN', rating: 2105, streak: 128, isCurrentUser: false },
  { rank: 3, handle: 'null_pointer_exception', country: 'UK', rating: 2090, streak: 15, isCurrentUser: false },
  { rank: 4, handle: 'dynamic_dan', country: 'CA', rating: 2045, streak: 8, isCurrentUser: false },
  { rank: 5, handle: 'tree_traverser', country: 'AU', rating: 1980, streak: 60, isCurrentUser: false },
];

const Leaderboards = () => {
  const [activeTab, setActiveTab] = useState('global');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="flex justify-between items-end" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Global Leaderboards</h2>
          <p style={{ color: 'var(--text-secondary)' }}>See how you stack up against the best developers.</p>
        </div>
        
        <div className="flex gap-2 p-1" style={{ background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          {['global', 'university', 'friends'].map(tab => (
            <button
              key={tab}
              style={{
                padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                background: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                textTransform: 'capitalize'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Rank</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Developer</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Platforms</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Rating</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Streak</th>
            </tr>
          </thead>
          <tbody>
            {mockLeaderboard.map((user) => (
              <tr key={user.rank} style={{ 
                borderTop: '1px solid var(--card-border)',
                background: user.isCurrentUser ? 'rgba(217, 119, 6, 0.05)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                  {user.rank <= 3 ? <Trophy size={20} color={user.rank === 1 ? '#F59E0B' : user.rank === 2 ? '#94A3B8' : '#B45309'} /> : `#${user.rank}`}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`} alt={user.handle} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <span style={{ fontWeight: user.isCurrentUser ? 700 : 500 }}>{user.handle}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.country}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div className="flex gap-2 text-muted">
                    <Code2 size={16} />
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{user.rating}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div className="flex items-center gap-1" style={{ color: 'var(--accent-streak)', fontWeight: 600 }}>
                    <Flame size={16} /> {user.streak}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboards;
