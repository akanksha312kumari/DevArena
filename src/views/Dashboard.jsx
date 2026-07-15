import React from 'react';
import { Flame, Target, Trophy, Activity, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Easy', value: 400, color: 'var(--accent-success)' },
  { name: 'Medium', value: 300, color: 'var(--accent-streak)' },
  { name: 'Hard', value: 100, color: 'var(--accent-danger)' },
];

const Dashboard = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back, tourist_fanboy 👋</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Here's your coding progress and recent activity.</p>
      </header>

      {/* Metric Grid */}
      <div className="dashboard-grid">
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Global Rating</div>
              <Trophy size={20} color="var(--accent-primary)" />
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>2150 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Elo</span></div>
          </div>
          <div style={{ color: 'var(--accent-success)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={16} /> +24 this week
          </div>
        </div>

        <div className="card flex flex-col justify-between" style={{ background: 'linear-gradient(145deg, var(--card-bg), var(--bg-primary))' }}>
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Daily Streak</div>
              <Flame size={20} color="var(--accent-streak)" />
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>42 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Days</span></div>
          </div>
          <div style={{ display: 'flex', gap: '2px', marginTop: '1rem' }}>
            {/* Fake Heatmap Blocks */}
            {[...Array(14)].map((_, i) => (
              <div key={i} style={{ flex: 1, height: '8px', borderRadius: '2px', background: Math.random() > 0.3 ? 'var(--accent-success)' : 'var(--card-border)', opacity: Math.random() * 0.5 + 0.5 }} />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Problems Solved</div>
            <Target size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ height: '100px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={30} outerRadius={45} paddingAngle={2} dataKey="value">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>800</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Solved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
      <div className="card flex flex-col gap-4">
        {[
          { icon: Target, title: "Solved 'Two Sum' on LeetCode", time: '2 hours ago', color: '#10B981' },
          { icon: Trophy, title: 'Placed Top 5% in Codeforces Round #999', time: 'Yesterday', color: 'var(--accent-primary)' },
          { icon: Activity, title: "Earned 'Binary Beast' Badge", time: '2 days ago', color: 'var(--accent-streak)' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-4" style={{ paddingBottom: i !== 2 ? '1rem' : '0', borderBottom: i !== 2 ? '1px solid var(--card-border)' : 'none' }}>
              <div style={{ background: `${item.color}15`, padding: '0.75rem', borderRadius: '50%', color: item.color }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
