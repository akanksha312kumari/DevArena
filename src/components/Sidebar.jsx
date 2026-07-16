import React from 'react';
import { LayoutDashboard, Swords, Users, Bot, Trophy, Code2, Settings, Hash, Target } from 'lucide-react';
import logo from '../assets/logoooo.png';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'duels', label: 'Live Duels', icon: Swords },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'rooms', label: 'Private Rooms', icon: Hash },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'problems', label: 'Problems', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <aside className="sidebar">
      <div className="flex items-center gap-3" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <img src={logo} alt="DevArena Logo" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>DevArena</h1>
      </div>

      <nav style={{ flex: 1 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-item w-full ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ textAlign: 'left' }}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          className={`nav-item w-full ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{ textAlign: 'left', marginBottom: 0 }}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>

        {user && (
          <div className="clay-recessed" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
              <img src={user.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="User Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level {user.level || 1}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
