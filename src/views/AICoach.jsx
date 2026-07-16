import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Bot, Send, Sparkles } from 'lucide-react';

const radarData = [
  { subject: 'Dynamic Programming', A: 42, fullMark: 100 },
  { subject: 'Graphs', A: 88, fullMark: 100 },
  { subject: 'Strings', A: 65, fullMark: 100 },
  { subject: 'Trees', A: 90, fullMark: 100 },
  { subject: 'Math', A: 50, fullMark: 100 },
  { subject: 'Greedy', A: 75, fullMark: 100 },
];

const AICoach = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your DevArena AI Coach. Based on your stats, you're crushing Trees and Graphs, but Dynamic Programming could use some work. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;
    
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred while connecting to the AI Coach." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid" style={{ height: '100%', gridTemplateColumns: '1fr 2fr' }}>
      {/* Weakness Detection Panel */}
      <div className="card flex flex-col h-full">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Skill Analysis</h3>
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Proficiency" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Focus Areas</h4>
          <div className="flex gap-2 flex-wrap">
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>Dynamic Programming (42%)</span>
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>Math (50%)</span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="card flex flex-col h-full" style={{ padding: '0', overflow: 'hidden' }}>
        <header className="flex items-center gap-2" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-secondary)' }}>
          <Bot size={20} color="var(--accent-primary)" />
          <h3 style={{ fontWeight: 600 }}>DevArena Coach</h3>
        </header>

        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div style={{
                maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: '12px',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--card-border)' }}>
          <div className="flex gap-2 mb-3 overflow-x-auto" style={{ paddingBottom: '0.5rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => handleSend("Analyze my recent Codeforces slump")}>
              <Sparkles size={14} /> Analyze my recent Codeforces slump
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => handleSend("Give me a DP roadmap for interview prep")}>
              <Sparkles size={14} /> Give me a DP roadmap for interview prep
            </button>
          </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..." 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  disabled={loading}
                />
                <button className="btn btn-primary" onClick={() => handleSend(input)} disabled={loading}>
                  <Send size={20} />
                </button>
              </div>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
