import React, { useState } from 'react';
import { Moon, Sun, Link as LinkIcon, Unlink, LogOut, AlertTriangle } from 'lucide-react';

const Settings = ({ isDark, setIsDark, setActiveTab }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    // In a real app, clear tokens, context, etc.
    setActiveTab('dashboard'); // Redirect to dashboard or login
    setShowLogoutConfirm(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Settings</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your profile, preferences, and connected accounts.</p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Profile Info Card */}
        <section className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Profile Information</h3>
          
          <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=tourist_fanboy" alt="User Avatar" style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
            <button className="btn btn-outline">Change Avatar</button>
          </div>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Username</label>
              <input type="text" defaultValue="tourist_fanboy" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Bio</label>
              <textarea defaultValue="Competitive programmer. Coffee addict." rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>

          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Connected Accounts</h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { name: 'LeetCode', connected: true },
              { name: 'Codeforces', connected: true },
              { name: 'HackerRank', connected: false }
            ].map(platform => (
              <div key={platform.name} className="flex items-center justify-between" style={{ padding: '1rem', border: '1px solid var(--card-border)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-3">
                  <LinkIcon size={20} color="var(--text-muted)" />
                  <span style={{ fontWeight: 500 }}>{platform.name}</span>
                </div>
                {platform.connected ? (
                  <button className="btn btn-outline" style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}>
                    <Unlink size={16} /> Disconnect
                  </button>
                ) : (
                  <button className="btn btn-primary">
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Display Preferences */}
        <section className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Display Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontWeight: 500 }}>Theme Mode</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Toggle between Warm Light and Warm Dark mode</div>
            </div>
            <button 
              onClick={() => setIsDark(!isDark)}
              style={{
                width: '60px', height: '32px', borderRadius: '16px', border: 'none',
                background: isDark ? 'var(--accent-primary)' : '#E5E7EB',
                position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
              }}
            >
              <div style={{
                position: 'absolute', top: '4px', left: isDark ? '32px' : '4px',
                width: '24px', height: '24px', borderRadius: '50%', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                {isDark ? <Moon size={14} color="var(--accent-primary)" /> : <Sun size={14} color="#F59E0B" />}
              </div>
            </button>
          </div>
        </section>

        {/* Account Actions */}
        <section className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--accent-danger)' }}>Danger Zone</h3>
          
          <button 
            className="btn"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', width: '100%', justifyContent: 'center' }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={20} /> Log Out
          </button>

          {showLogoutConfirm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
            }}>
              <div className="card" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-primary)' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '1rem', color: 'var(--accent-danger)' }}>
                  <AlertTriangle size={24} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Confirm Log Out</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Are you sure you want to log out of DevArena? You will need to sign back in to access your profile and duels.</p>
                <div className="flex justify-end gap-3">
                  <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                  <button className="btn" style={{ background: 'var(--accent-danger)', color: 'white' }} onClick={handleLogout}>Log Out</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
