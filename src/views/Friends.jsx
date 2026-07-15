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

  // Challenge Modal State
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [challengeData, setChallengeData] = useState({
    platform: 'LeetCode',
    problemId: '',
    timeLimit: 30
  });
  
  // Incoming Challenge Modal State
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    
    if (socket) {
      const onChallengeReceived = (data) => {
        setIncomingChallenge(data);
      };

      const onChallengeRejected = (data) => {
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);
      };

      socket.on('challenge_received', onChallengeReceived);
      socket.on('challenge_rejected', onChallengeRejected);
      
      return () => {
        socket.off('challenge_received', onChallengeReceived);
        socket.off('challenge_rejected', onChallengeRejected);
      };
    }
  }, [socket]);

  const acceptIncomingChallenge = () => {
    if (!incomingChallenge) return;
    socket.emit('accept_challenge', {
      senderId: incomingChallenge.senderId,
      challengeId: incomingChallenge.challengeId,
      problem: incomingChallenge.problem,
      timeLimit: incomingChallenge.timeLimit
    });
    setIncomingChallenge(null);
  };

  const rejectIncomingChallenge = () => {
    if (!incomingChallenge) return;
    socket.emit('reject_challenge', { senderId: incomingChallenge.senderId });
    setIncomingChallenge(null);
  };

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

  const openChallengeModal = (targetUser) => {
    setChallengeTarget(targetUser);
    setShowChallengeModal(true);
  };

  const handleChallengeSubmit = (e) => {
    e.preventDefault();
    if (!socket || !challengeTarget) return;
    
    if (!challengeData.problemId) {
      setMessage('Please enter a problem name or URL');
      return;
    }

    const problem = {
      platform: challengeData.platform,
      problemId: challengeData.problemId,
      title: challengeData.problemId, // Using ID/URL as title for simplicity
      difficulty: 'Custom'
    };
    
    socket.emit('send_challenge', {
      targetUserId: challengeTarget._id,
      problem,
      timeLimit: parseInt(challengeData.timeLimit)
    });
    
    setShowChallengeModal(false);
    setChallengeTarget(null);
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
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {friends.map(f => (
            <div key={f._id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <img src={f.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <div>
                  <h4 style={{ fontWeight: 600 }}>{f.username}</h4>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Rating: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{f.stats?.globalRating || 0}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-outline flex items-center justify-center gap-2" onClick={() => openChallengeModal(f)}>
                <Swords size={16} /> Challenge to Duel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && challengeTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Challenge {challengeTarget.username}</h3>
            <form onSubmit={handleChallengeSubmit} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Platform</label>
                <select 
                  value={challengeData.platform}
                  onChange={e => setChallengeData({...challengeData, platform: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="LeetCode">LeetCode</option>
                  <option value="Codeforces">Codeforces</option>
                  <option value="CodeChef">CodeChef</option>
                  <option value="AtCoder">AtCoder</option>
                  <option value="HackerRank">HackerRank</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Problem URL or Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. https://leetcode.com/problems/two-sum/"
                  value={challengeData.problemId}
                  onChange={e => setChallengeData({...challengeData, problemId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Time Limit (Minutes)</label>
                <select 
                  value={challengeData.timeLimit}
                  onChange={e => setChallengeData({...challengeData, timeLimit: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setShowChallengeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2"><Swords size={16} /> Send Challenge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incoming Challenge Modal */}
      {incomingChallenge && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }}>
          <div className="card text-center" style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.3s' }}>
            <div style={{ padding: '1rem', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-primary)', display: 'inline-block' }}>
              <Swords size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Incoming Duel Challenge!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You have been challenged to solve <strong>{incomingChallenge.problem?.title || 'a problem'}</strong> on <strong>{incomingChallenge.problem?.platform}</strong>.
            </p>
            <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Time Limit: <strong>{incomingChallenge.timeLimit} Minutes</strong>
            </div>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-outline" onClick={rejectIncomingChallenge} style={{ flex: 1, borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}>Decline</button>
              <button className="btn btn-primary" onClick={acceptIncomingChallenge} style={{ flex: 1 }}>Accept Duel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
