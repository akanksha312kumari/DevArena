import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Activity, Swords, Code, ExternalLink, Calendar, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Heatmap = ({ heatmapData = {} }) => {
  // Generate a mock or real heatmap (last 52 weeks = 364 days for a full horizontal heatmap)
  const weeks = 52;
  const days = 7;
  const totalDays = weeks * days;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const dates = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  const getColor = (count) => {
    if (!count || count === 0) return 'var(--card-border)';
    if (count === 1) return '#0e4429'; // level 1
    if (count === 2) return '#006d32'; // level 2
    if (count >= 3 && count <= 5) return '#26a641'; // level 3
    return '#39d353'; // level 4
  };

  // Group columns by month to determine where to place the label
  const monthLabels = [];
  let currentMonth = -1;
  const columns = Array.from({ length: weeks }).map((_, weekIndex) => {
    const weekDates = [];
    let weekMonth = -1;
    for (let dayIndex = 0; dayIndex < days; dayIndex++) {
      const dateObj = dates[weekIndex * days + dayIndex];
      weekDates.push(dateObj);
      if (dayIndex === 0) weekMonth = new Date(dateObj).getMonth();
    }
    
    if (weekMonth !== currentMonth) {
      monthLabels.push({ index: weekIndex, label: new Date(dates[weekIndex * days]).toLocaleString('default', { month: 'short' }) });
      currentMonth = weekMonth;
    }
    
    return weekDates;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {columns.map((weekDates, weekIndex) => (
          <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {weekDates.map((dateStr, dayIndex) => {
              const count = heatmapData[dateStr] || 0;
              return (
                <div 
                  key={dayIndex}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: getColor(count),
                    opacity: count === 0 ? 0.3 : 1
                  }}
                  title={`${count} submissions on ${dateStr}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Month Labels */}
      <div style={{ position: 'relative', height: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: `${weeks * 16}px` }}>
        {monthLabels.map((ml, i) => (
          <div key={i} style={{ position: 'absolute', left: `${ml.index * 16}px` }}>
            {ml.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [potd, setPotd] = useState(null);
  
  const stats = user?.stats || { globalRating: 0, dailyStreak: 0, problemsSolved: { easy: 0, medium: 0, hard: 0 } };
  const totalSolved = (stats.problemsSolved?.total) || ((stats.problemsSolved?.easy || 0) + (stats.problemsSolved?.medium || 0) + (stats.problemsSolved?.hard || 0));
  
  // Fake total counts for progress calculation
  const EASY_TOTAL = 800;
  const MED_TOTAL = 1500;
  const HARD_TOTAL = 700;
  const totalProblems = EASY_TOTAL + MED_TOTAL + HARD_TOTAL;

  useEffect(() => {
    // Fetch POTD dynamically
    const fetchPotd = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/problems/potd', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && data.title) {
          setPotd(data);
        }
      } catch (err) {
        console.error("Failed to fetch POTD", err);
      }
    };
    fetchPotd();
  }, []);

  const pieData = [
    { name: 'Easy', value: stats.problemsSolved?.easy || 0, color: 'var(--accent-success)' },
    { name: 'Medium', value: stats.problemsSolved?.medium || 0, color: 'var(--accent-streak)' },
    { name: 'Hard', value: stats.problemsSolved?.hard || 0, color: 'var(--accent-danger)' },
  ];
  
  // Ensure the chart shows empty state if no problems solved
  const chartData = totalSolved === 0 ? [{ name: 'Empty', value: 1, color: 'var(--card-border)' }] : pieData;

  const recentSubmissions = user?.recentSubmissions || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Compact Top Profile Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
        <div className="flex items-center gap-4">
          <img src={user?.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>{user?.username}</h2>
            <div className="flex gap-4" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Level {user?.level || 1}</span>
              <span>{user?.xp || 0} XP</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Global Rating</div>
            <div className="flex items-center gap-1 justify-center" style={{ fontWeight: 600 }}>
              <Trophy size={16} color="var(--accent-primary)" />
              {stats.globalRating}
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--card-border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Daily Streak</div>
            <div className="flex items-center gap-1 justify-center" style={{ fontWeight: 600 }}>
              <Flame size={16} color="var(--accent-streak)" />
              {stats.dailyStreak}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
        
        {/* Problems Solved */}
        <div className="card flex flex-col items-center gap-2">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', alignSelf: 'flex-start', marginBottom: '0.5rem' }}>Problems Solved</h3>
          
          <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={52}
                  paddingAngle={totalSolved > 0 ? 5 : 0}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalSolved}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Solved</div>
            </div>
          </div>

          <div className="flex gap-2 w-full justify-between mt-2">
            <div className="flex flex-col items-center" style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', flex: 1, border: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-success)', marginBottom: '0.25rem', fontWeight: 600 }}>Easy</span>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>{stats.problemsSolved?.easy || 0}</span>
            </div>
            <div className="flex flex-col items-center" style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', flex: 1, border: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-streak)', marginBottom: '0.25rem', fontWeight: 600 }}>Med</span>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>{stats.problemsSolved?.medium || 0}</span>
            </div>
            <div className="flex flex-col items-center" style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', flex: 1, border: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-danger)', marginBottom: '0.25rem', fontWeight: 600 }}>Hard</span>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>{stats.problemsSolved?.hard || 0}</span>
            </div>
          </div>
        </div>

        {/* Duels Stats Card */}
        <div className="card flex flex-col justify-between">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Duel Statistics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Total Duels</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.stats?.duels?.total || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Win Rate</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {user?.stats?.duels?.total ? Math.round(((user?.stats?.duels?.wins || 0) / user.stats.duels.total) * 100) : 0}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Wins</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-success)' }}>{user?.stats?.duels?.wins || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Losses</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{user?.stats?.duels?.losses || 0}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center" style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div className="flex items-center gap-2">
                <Trophy size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Arena Rank</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {user?.stats?.arenaRank ? `#${user.stats.arenaRank}` : 'Unranked'}
              </div>
            </div>
          </div>
        </div>

        {/* POTD */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Problem of the Day</h3>
              <div title="Past POTDs" style={{ cursor: 'pointer' }}>
                <Calendar size={16} color="var(--accent-primary)" />
              </div>
            </div>
            
            {potd ? (
              <>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{potd.title}</div>
                <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    color: potd.difficulty === 'Easy' ? 'var(--accent-success)' : potd.difficulty === 'Medium' ? 'var(--accent-streak)' : 'var(--accent-danger)', 
                    fontWeight: 500 
                  }}>
                    {potd.difficulty}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{potd.platform}</span>
                  {potd.tags && potd.tags.length > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>• {potd.tags.slice(0,2).join(', ')}</span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Loading Problem of the Day...</div>
            )}
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={() => potd?.url && window.open(potd.url, '_blank')}
            disabled={!potd}
          >
            Solve Now
          </button>
        </div>

      </div>

      {/* Heatmap (Full Width) */}
      <div className="card">
        <div className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {Object.values(user?.heatmapData || {}).reduce((acc, count) => acc + count, 0)}
            </span> submissions in the past one year
          </div>
          
          <div className="flex gap-4 items-center" style={{ fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total active days: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{Object.keys(user?.heatmapData || {}).length}</span></span>
            <span style={{ color: 'var(--text-muted)' }}>Max streak: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{stats.maxStreak}</span></span>
            <select style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
               <option>Current</option>
            </select>
          </div>
        </div>
        
        <Heatmap heatmapData={user?.heatmapData || {}} />
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Recent Submissions</h3>
        <div className="flex flex-col gap-3">
          {recentSubmissions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent submissions. Sync your platforms to view activity!</div>
          ) : (
            recentSubmissions.map((sub, i) => (
              <div key={i} className="flex items-center justify-between" style={{ paddingBottom: '0.75rem', borderBottom: i !== recentSubmissions.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} color="var(--accent-success)" />
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }} onClick={() => sub.url && window.open(sub.url, '_blank')}>
                    {sub.title}
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {sub.platform}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(sub.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Platform Breakdowns */}
      {user?.platformStats && Object.keys(user.platformStats).length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Platform Breakdowns</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(user.platformStats).map(([platform, pStats]) => {
              if (!pStats || (pStats.problemsSolved?.total === 0 && pStats.rating === 0)) return null;
              return (
                <div key={platform} style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>
                  <div className="flex items-center gap-2" style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                    <Code size={14} color="var(--accent-primary)" />
                    {platform}
                  </div>
                  <div className="flex justify-between" style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rating: <span style={{ color: 'var(--text-primary)' }}>{pStats.rating || 'N/A'}</span></span>
                    <span style={{ color: 'var(--text-muted)' }}>Solved: <span style={{ color: 'var(--text-primary)' }}>{pStats.problemsSolved?.total || 0}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
