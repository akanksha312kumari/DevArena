import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Friends = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    
    if (socket) {
      socket.on('challenge_received', (data) => {
        if (window.confirm(`You received a challenge! Do you want to accept? (Time Limit: ${data.timeLimit} mins)`)) {
          socket.emit('accept_challenge', {
            senderId: data.senderId,
            challengeId: data.challengeId,
            problem: data.problem,
            timeLimit: data.timeLimit
          });
        } else {
          socket.emit('reject_challenge', { senderId: data.senderId });
        }
      });
      
      socket.on('challenge_rejected', (data) => {
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);
      });
      
      return () => {
        socket.off('challenge_received');
        socket.off('challenge_rejected');
      };
    }
  }, [socket]);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const sendRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/request/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error sending request');
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/accept/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFriends();
        fetchFriendRequests();
        setMessage('Friend request accepted!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/reject/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFriendRequests();
        setMessage('Friend request rejected');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChallenge = (targetUserId) => {
    if (!socket) return;
    
    // In a real app, this would open a modal to select a problem.
    // Here we hardcode a problem for demonstration.
    const problem = {
      platform: 'LeetCode',
      problemId: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy'
    };
    
    socket.emit('send_challenge', {
      targetUserId,
      problem,
      timeLimit: 15 // 15 minutes
    });
    
    setMessage('Challenge sent!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Friends</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Find and connect with other developers.</p>
      </header>

      {message && <div style={{ padding: '1rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <button type="submit" className="btn btn-primary"><Search size={20} /> Search</button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Search Results</h4>
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
              {searchResults.map(u => (
                <div key={u._id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <img src={u.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: '1rem' }} />
                  <h4 style={{ fontWeight: 600 }}>{u.username}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Rating: {u.stats?.globalRating || 0}</p>
                  <button className="btn btn-outline" onClick={() => sendRequest(u._id)}><UserPlus size={16} /> Add Friend</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {friendRequests.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-primary)' }}>Incoming Friend Requests</h3>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {friendRequests.map(r => (
              <div key={r._id} className="card flex items-center justify-between gap-4" style={{ borderColor: 'var(--accent-primary)' }}>
                <div className="flex items-center gap-4">
                  <img src={r.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontWeight: 600 }}>{r.username}</h4>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleRejectRequest(r._id)}>Reject</button>
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => handleAcceptRequest(r._id)}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Your Friends List</h3>
      {friends.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>You haven't added any friends yet.</p>
      ) : (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {friends.map(f => (
            <div key={f._id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={f.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <div>
                  <h4 style={{ fontWeight: 600 }}>{f.username}</h4>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rating: {f.stats?.globalRating || 0}</div>
                </div>
              </div>
              <button 
                className="btn btn-outline" 
                style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', padding: '0.5rem' }}
                onClick={() => handleChallenge(f._id)}
                title="Challenge to Duel"
              >
                <Swords size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;
