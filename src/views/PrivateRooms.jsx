import React, { useState } from 'react';
import { Users, Hash, Trophy, ChevronRight, MessageSquare } from 'lucide-react';

const rooms = [
  { id: 1, name: 'MIT Coding Club', members: 142, active: 12 },
  { id: 2, name: 'FAANG Aspirants 2026', members: 890, active: 45 },
  { id: 3, name: 'The Dynamic Programmers', members: 56, active: 3 },
];

const PrivateRooms = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // chat, leaderboard, challenges

  if (selectedRoom) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-outline" onClick={() => setSelectedRoom(null)}>Back</button>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedRoom.name}</h2>
            <div style={{ color: 'var(--text-muted)' }}>{selectedRoom.members} members</div>
          </div>
        </header>

        <div className="flex gap-4" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
          {['chat', 'leaderboard', 'challenges'].map(tab => (
            <button
              key={tab}
              style={{
                background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : 'none',
                textTransform: 'capitalize'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
                {/* Mock Chat */}
                <div className="flex gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=null_pointer_exception" alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>null_pointer_exception <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>10:42 AM</span></div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '0 8px 8px 8px', marginTop: '0.25rem' }}>
                      Anyone up for a quick 1v1 on graph traversal?
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=algo_queen" alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>algo_queen <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>10:45 AM</span></div>
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '0 8px 8px 8px', marginTop: '0.25rem' }}>
                      Sure, send the lobby link!
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                <input type="text" placeholder="Message #general" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none' }} />
                <button className="btn btn-primary">Send</button>
              </div>
            </>
          )}
          {activeTab === 'leaderboard' && (
            <div style={{ color: 'var(--text-muted)' }}>Room leaderboard functionality coming soon...</div>
          )}
          {activeTab === 'challenges' && (
            <div style={{ color: 'var(--text-muted)' }}>Active mini-contests will appear here...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Communities</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Collaborate, compete, and grow with your private groups.</p>
      </header>

      <div className="dashboard-grid">
        {rooms.map(room => (
          <div key={room.id} className="card flex flex-col justify-between cursor-pointer" onClick={() => setSelectedRoom(room)}>
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                  <Users size={24} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{room.name}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-4">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{room.members} total</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--accent-success)' }}>• {room.active} online</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivateRooms;
