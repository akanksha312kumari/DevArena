import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import LiveDuels from './views/LiveDuels';
import Friends from './views/Friends';
import PrivateRooms from './views/PrivateRooms';
import AICoach from './views/AICoach';
import Leaderboards from './views/Leaderboards';
import Problems from './views/Problems';
import Settings from './views/Settings';
import Auth from './views/Auth';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [activeDuelData, setActiveDuelData] = useState(null);
  const { user, loading } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const onChallengeAccepted = (data) => {
      setActiveDuelData(data);
      setActiveTab('duels');
    };

    const onDuelFinished = () => {
      // Clear global duel state so returning to the tab doesn't re-trigger a stale duel
      setActiveDuelData(null);
    };

    socket.on('challenge_accepted', onChallengeAccepted);
    socket.on('duel_finished', onDuelFinished);
    
    return () => {
      socket.off('challenge_accepted', onChallengeAccepted);
      socket.off('duel_finished', onDuelFinished);
    };
  }, [socket]);

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

        <div className="content-area">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'duels' && <LiveDuels initialDuelData={activeDuelData} />}
          {activeTab === 'friends' && <Friends />}
          {activeTab === 'rooms' && <PrivateRooms />}
          {activeTab === 'coach' && <AICoach />}
          {activeTab === 'problems' && <Problems />}
          {activeTab === 'leaderboard' && <Leaderboards />}
          {activeTab === 'settings' && <Settings isDark={isDark} setIsDark={setIsDark} setActiveTab={setActiveTab} />}
        </div>
      </main>
    </div>
  );
};

export default App;
