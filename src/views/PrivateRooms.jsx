import React, { useState, useEffect, useRef } from 'react';
import { Users, Hash, ChevronRight, Send, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const PrivateRooms = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newRoomData, setNewRoomData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Fallback to our prototype room if none are returned (for testing)
        if (data.length === 0) {
          setRooms([{ _id: 'room1', name: 'Global Dev Lounge', members: [1] }]);
        } else {
          setRooms(data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newRoomData)
      });
      
      if (res.ok) {
        const newRoom = await res.json();
        setRooms(prev => [...prev, newRoom]);
        setIsCreating(false);
        setNewRoomData({ name: '', description: '' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ inviteCode })
      });
      
      if (res.ok) {
        const joinedRoom = await res.json();
        // Check if already in rooms list
        if (!rooms.find(r => r._id === joinedRoom._id)) {
          setRooms(prev => [...prev, joinedRoom]);
        }
        setIsJoining(false);
        setInviteCode('');
        setSelectedRoom(joinedRoom);
      } else {
        const err = await res.json();
        alert(err.message || 'Invalid invite code');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!socket || !selectedRoom) return;

    socket.emit('join_room', selectedRoom._id || selectedRoom.id);

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleUserTyping = ({ username }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(username);
        return newSet;
      });
    };

    const handleUserStopTyping = ({ username }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_room', selectedRoom._id || selectedRoom.id);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !selectedRoom) return;

    const msgData = {
      roomId: selectedRoom._id || selectedRoom.id,
      message: newMessage,
      senderId: user._id,
      senderName: user.username,
      timestamp: new Date()
    };

    // Optimistic update
    setMessages((prev) => [...prev, msgData]);
    
    socket.emit('send_message', msgData);
    socket.emit('stop_typing', { roomId: selectedRoom._id || selectedRoom.id, username: user.username });
    
    setNewMessage('');
    setIsTyping(false);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !selectedRoom) return;

    if (!isTyping && e.target.value) {
      setIsTyping(true);
      socket.emit('typing', { roomId: selectedRoom._id || selectedRoom.id, username: user.username });
    } else if (isTyping && !e.target.value) {
      setIsTyping(false);
      socket.emit('stop_typing', { roomId: selectedRoom._id || selectedRoom.id, username: user.username });
    }
  };

  if (selectedRoom) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-outline" onClick={() => setSelectedRoom(null)}>Back</button>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedRoom.name}</h2>
            <div style={{ color: 'var(--text-muted)' }}>
              {selectedRoom.members?.length || selectedRoom.members} members 
              {selectedRoom.inviteCode && ` • Invite Code: ${selectedRoom.inviteCode}`}
            </div>
          </div>
        </header>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No messages yet. Say hi!</div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user._id;
                return (
                  <div key={idx} className="flex gap-3" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    {!isMe && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                    <div>
                      {!isMe && <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{msg.senderName}</div>}
                      <div style={{ 
                        background: isMe ? 'var(--accent-primary)' : 'var(--bg-secondary)', 
                        color: isMe ? 'white' : 'var(--text-primary)',
                        padding: '0.5rem 1rem', 
                        borderRadius: isMe ? '8px 0 8px 8px' : '0 8px 8px 8px' 
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {typingUsers.size > 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 mt-4" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
            <input 
              type="text" 
              placeholder={`Message #${selectedRoom.name.replace(/\s+/g, '-').toLowerCase()}`}
              value={newMessage}
              onChange={handleTyping}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} 
            />
            <button type="submit" className="btn btn-primary"><Send size={20} /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Private Rooms</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Collaborate and chat in real-time.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setIsJoining(true)}>Join Room</button>
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}><Plus size={20} /> Create Room</button>
        </div>
      </header>

      {isJoining && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Join Private Room</h3>
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Invite Code</label>
                <input 
                  type="text" required
                  value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                  placeholder="e.g. 5A3B9C"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setIsJoining(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreating && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Create Private Room</h3>
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Name</label>
                <input 
                  type="text" required
                  value={newRoomData.name} onChange={e => setNewRoomData({...newRoomData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <input 
                  type="text" 
                  value={newRoomData.description} onChange={e => setNewRoomData({...newRoomData, description: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-outline" onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {rooms.map(room => (
          <div key={room._id || room.id} className="card flex flex-col justify-between cursor-pointer" onClick={() => setSelectedRoom(room)} style={{ transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                  <Hash size={24} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{room.name}</h3>
              </div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {room.description || 'A place to discuss algorithms, share memes, and challenge friends.'}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Users size={16} /> {room.members?.length || room.members} Members
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
