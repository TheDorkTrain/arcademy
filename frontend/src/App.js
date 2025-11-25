import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Hub from './components/Hub';
import Login from './components/Login';
import Register from './components/Register';
import Sudoku from './components/games/Sudoku';
import RocketMans from './components/games/RocketMans';
import DungeonCrawler from './components/games/DungeonCrawler';
import PersonalityQuiz from './components/games/PersonalityQuiz';
import WouldYouRather from './components/games/WouldYouRather';
import Zork from './components/games/Zork'; 
import Rocxs from './components/games/Rocxs';
import OneNightAtRocket from './components/games/OneNightAtRocket';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));


  useEffect(() => {
    if (token && !user) {
      // Verify token and get user info
      fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      });
    }
  }, [token, user]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={<Hub user={user} onLogout={handleLogout} token={token} />} />
          <Route path="/game/sudoku" element={<Sudoku user={user} token={token} />} />
          <Route path="/game/rocketmans" element={<RocketMans user={user} token={token} />} />
          <Route path="/game/dungeon" element={<DungeonCrawler user={user} token={token} />} />
          <Route path="/game/personality-quiz" element={<PersonalityQuiz user={user} token={token} />} />
          <Route path="/game/would-you-rather" element={<WouldYouRather user={user} token={token} />} />
          <Route path="/game/zork" element={<Zork user={user} token={token} />} />
          <Route path="/game/rocxs" element={<Rocxs user={user} token={token} />} />
          <Route path="/game/one-night-at-rocket" element={<OneNightAtRocket user={user} token={token} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
