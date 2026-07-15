import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import LiveDuels from './views/LiveDuels';
import Friends from './views/Friends';
import AICoach from './views/AICoach';
import Leaderboards from './views/Leaderboards';
import Settings from './views/Settings';
import Auth from './views/Auth';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Auth />;

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-4">
            <span>{user.username}</span>
            <img src={user.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'duels' && <LiveDuels />}
          {activeTab === 'friends' && <Friends />}
          {activeTab === 'coach' && <AICoach />}
          {activeTab === 'leaderboard' && <Leaderboards />}
          {activeTab === 'settings' && <Settings isDark={isDark} setIsDark={setIsDark} setActiveTab={setActiveTab} />}
        </div>
      </main>
    </div>
  );
};

export default App;
