import React from 'react';
import { Flame, Target, Trophy, Activity, TrendingUp, Swords, Code, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  const stats = user?.stats || { globalRating: 0, dailyStreak: 0, problemsSolved: { easy: 0, medium: 0, hard: 0 } };
  
  const data = [
    { name: 'Easy', value: stats.problemsSolved.easy || 1, color: 'var(--accent-success)' },
    { name: 'Medium', value: stats.problemsSolved.medium || 1, color: 'var(--accent-streak)' },
    { name: 'Hard', value: stats.problemsSolved.hard || 1, color: 'var(--accent-danger)' },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="dashboard-grid">
        <div className="card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, var(--accent-primary), #3B82F6)', color: 'white' }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back, {user?.username}! 🚀</h2>
              <p style={{ opacity: 0.9 }}>Your skills are sharpening. Keep up the good work!</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Level {user?.level || 1}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{user?.xp || 0} XP</div>
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Global Rating (Elo)</div>
            <Trophy size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.globalRating}</div>
          <div className="flex items-center gap-1" style={{ color: 'var(--accent-success)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <TrendingUp size={16} />
            <span>+24 this week</span>
          </div>
        </div>

        <div className="card flex flex-col justify-between" style={{ background: 'linear-gradient(145deg, var(--card-bg), var(--bg-primary))' }}>
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Daily Streak</div>
              <Flame size={20} color="var(--accent-streak)" />
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.dailyStreak} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Days</span></div>
          </div>
          <div style={{ display: 'flex', gap: '2px', marginTop: '1rem' }}>
            {/* Fake Heatmap Blocks */}
            {[...Array(14)].map((_, i) => (
              <div key={i} style={{ flex: 1, height: '8px', borderRadius: '2px', background: Math.random() > 0.3 ? 'var(--accent-success)' : 'var(--card-border)', opacity: Math.random() * 0.5 + 0.5 }} />
            ))}
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Problems Solved</div>
            <Target size={20} color="var(--accent-danger)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.problemsSolved.total || (stats.problemsSolved.easy + stats.problemsSolved.medium + stats.problemsSolved.hard)}</div>
            <div style={{ width: '80px', height: '80px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" innerRadius={25} outerRadius={40} paddingAngle={2}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex gap-4 mt-4" style={{ fontSize: '0.875rem' }}>
            <div style={{ color: 'var(--accent-success)' }}>{stats.problemsSolved.easy} Easy</div>
            <div style={{ color: 'var(--accent-streak)' }}>{stats.problemsSolved.medium} Med</div>
            <div style={{ color: 'var(--accent-danger)' }}>{stats.problemsSolved.hard} Hard</div>
          </div>
        </div>
      </div>

      {user?.platformStats && Object.keys(user.platformStats).length > 0 && (
        <>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }}>Platform Breakdown</h3>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {Object.entries(user.platformStats).map(([platform, pStats]) => {
              if (!pStats || (pStats.problemsSolved?.total === 0 && pStats.rating === 0)) return null;
              return (
                <div key={platform} className="card">
                  <div className="flex items-center justify-between" style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Code size={18} color="var(--accent-primary)" />
                      {platform}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rating</div>
                      <div style={{ fontWeight: 600 }}>{pStats.rating || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solved</div>
                      <div style={{ fontWeight: 600 }}>{pStats.problemsSolved?.total || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Streak</div>
                      <div style={{ fontWeight: 600 }}>{pStats.streak || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contests</div>
                      <div style={{ fontWeight: 600 }}>{pStats.contests || 0}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }}>Recent Activity</h3>
      <div className="card flex flex-col gap-4">
        {(!user?.activityFeed || user.activityFeed.length === 0) ? (
          <div style={{ color: 'var(--text-muted)' }}>No recent activity. Win a duel or start a streak to earn XP!</div>
        ) : (
          user.activityFeed.slice(0, 5).map((item, i) => {
            let Icon = Activity;
            let color = 'var(--text-primary)';
            if (item.type === 'duel_win') { Icon = Swords; color = 'var(--accent-success)'; }
            if (item.type === 'streak') { Icon = Flame; color = 'var(--accent-streak)'; }
            if (item.type === 'badge' || item.type === 'achievement') { Icon = Trophy; color = 'var(--accent-primary)'; }
            
            return (
              <div key={i} className="flex items-center gap-4" style={{ paddingBottom: i !== Math.min(user.activityFeed.length, 5) - 1 ? '1rem' : '0', borderBottom: i !== Math.min(user.activityFeed.length, 5) - 1 ? '1px solid var(--card-border)' : 'none' }}>
                <div style={{ background: `${color}15`, padding: '0.75rem', borderRadius: '50%', color: color }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.description} • {new Date(item.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
