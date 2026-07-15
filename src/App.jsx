import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import LiveDuels from './views/LiveDuels';
import PrivateRooms from './views/PrivateRooms';
import AICoach from './views/AICoach';
import Leaderboards from './views/Leaderboards';
import Settings from './views/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'duels':
        return <LiveDuels />;
      case 'rooms':
        return <PrivateRooms />;
      case 'coach':
        return <AICoach />;
      case 'leaderboards':
        return <Leaderboards />;
      case 'settings':
        return <Settings isDark={isDark} setIsDark={setIsDark} setActiveTab={setActiveTab} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
