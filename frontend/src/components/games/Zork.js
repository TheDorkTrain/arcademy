import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Zork() {
  const navigate = useNavigate();
  const [history, setHistory] = useState(["You are standing in an open field west of a white house, with a boarded front door."]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    setInput(e.target.value);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;
    setLoading(true);
    try {
      const res = await fetch('/api/zork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: command })
      });
      const data = await res.json();
      if (res.ok && data.response) {
        setHistory([...history, `> ${command}`, data.response]);
      } else {
        setHistory([...history, `> ${command}`, data.error || 'Unknown error']);
      }
    } catch (err) {
      setHistory([...history, `> ${command}`, 'Network error']);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Hub</button>
      <div className="zork-container" style={{ maxWidth: 600, margin: '40px auto', background: '#222', color: '#eee', padding: 20, borderRadius: 8 }}>
        <h2>Zork</h2>
        <div className="zork-history" style={{ minHeight: 200, marginBottom: 20 }}>
          {history.map((line, idx) => <div key={idx}>{line}</div>)}
        </div>
        <form onSubmit={handleCommand} style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={handleInput} disabled={loading} style={{ flex: 1, padding: 8, fontSize: 16, background: '#333', color: '#eee', border: '1px solid #444', borderRadius: 4 }} placeholder="Type a command..." />
          <button type="submit" disabled={loading} style={{ padding: '8px 16px', fontSize: 16, background: '#667eea', color: '#fff', border: 'none', borderRadius: 4 }}>{loading ? '...' : 'Go'}</button>
        </form>
      </div>
    </>
  );
}

export default Zork;
