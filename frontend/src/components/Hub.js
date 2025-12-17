import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adImg from './games/Images/ad.png';
import './Hub.css';
function Hub({ user, onLogout, token }) {
  const [scores, setScores] = useState([]);
  const [showAd, setShowAd] = useState(true);
  const navigate = useNavigate();
  const [activeGrid, setActiveGrid] = useState("games");
  const handleCloseAd = () => {
    setShowAd(false);
  };

  useEffect(() => {
    if (user && token) {
      fetchScores();
    }
  }, [user, token]);

  const fetchScores = async () => {
    try {
      const response = await fetch('/api/scores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setScores(data);
      }
    } catch (err) {
      console.error('Failed to fetch scores:', err);
    }
  };

  const games = [
    {
      name: 'ROCXS',
      path: '/game/rocxs',
      icon: '🪨',
      type: 'game',
      description: 'The ultimate ROCXS challenge!'
    },
    {
      name: 'Matrix Sudoku',
      path: '/game/sudoku',
      icon: '⚡',
      type: 'game',
      description: 'Classic number puzzle game'
    },
    {
      name: 'Zork Mini',
      path: '/game/zork',
      icon: '📜',
      type: 'openAI',
      description: 'Text adventure in classic D&D style'
    },
    {
      name: 'RocketMans',
      path: '/game/rocketmans',
      icon: '🚀',
      type: 'game',
      description: 'Navigate your rocket through space'
    },
    {
      name: 'Dungeon Crawler',
      path: '/game/dungeon',
      icon: '⚔️',
      type: 'game',
      description: 'Explore dungeons and fight monsters'
    },
    {
      name: 'Athlete Personality Quiz',
      path: '/game/personality-quiz',
      icon: '🏃‍♂️',
      type: 'game',
      description: 'Discover your athletic personality'
    },
      {
      name: 'Every Night the Crab Attacks',
      path: '/game/crabAttacks',
      icon: '🦀',
      type: 'game',
      description: 'Try and escape the island before the crab gets you.'
    },
    {
      name: 'Would You Rather',
      path: '/game/would-you-rather',
      icon: '🤔',
      type: 'game',
      description: 'Make tough choices'
    },
    {
      name: 'Bingo',
      path: '/game/bingo',
      icon: '🎲',
      type: 'game',
      description: 'Eggman Bingo & Custom Boards'
    },
    {
      name: 'Tetris',
      path: '/game/tetris',
      icon: '🧱',
      type: 'game',
      description: 'Classic block-stacking puzzle'
    },
    {
      name: 'Solitaire',
      path: '/game/solitaire',
      icon: '🃏',
      type: 'game',
      description: 'Classic card game with 3 difficulties'
    },
     {
      name: 'Guess Who',
      path: '/game/guess-who',
      icon: '🕵️‍♂️',
      type: 'game',
      description: 'Guess Who with the Next Gen'
    },

  ];
   const utils = [
    // {
    //   name: 'ROCXS',
    //   path: '/game/rocxs',
    //   icon: '🪨',
    //   type: 'game',
    //   description: 'The ultimate ROCXS challenge!'
    // },
  ];


  return (
    <div className="hub-container">
      {/* {showAd && (
        <div className="hub-ad-modal">
          <img src={adImg} alt="Ad" className="hub-ad-image" />
          <button className="hub-ad-close" onClick={handleCloseAd}>X</button>
        </div>
      )} */}
      <div className="sidebar">
       {user ? (
            <div className="user-info">
              <p>Welcome, {user.username}!</p>
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <div className="user-info">
                <p>Welcome, Guest!</p>
              <Link to="/login">
                <button className="logout-btn">Login</button>
              </Link>
              {' '}
              <Link to="/register">
                <button className="logout-btn">Register</button>
              </Link>
                     <p>Register to record your scores!</p>
            </div>
          )}
      {user && (
        <>
          <h2>Your Scores</h2>
          {scores.length > 0 ? (
            scores.map((score, index) => (
              <div key={index} className="score-item">
                <h3>{score.game_name}</h3>
                <p>{score.score} points</p>
              </div>
            ))
          ) : (
            <p>No scores yet. Play some games!</p>
          )}
        </>
      )}
      {user ? (<></>
          ) : (<>
            <div>
                 <img src={adImg} alt="Ad" style={{ width: '225px' }} className="hub-ad-image" onClick={() => navigate("/game/rocxs")}/>
              </div>
              </>
          )}
      </div>
      
      <div className="main-content">
        <div className="hub-header">
          <div className="hubTitle">
          <h1> NextGen Arcademy</h1>
          <h2> Collection of Games, Utils</h2>
          </div>
              <div className="hubKey" >
            <div>
            <div 
  className="color-swatch" 
  style={{ backgroundColor: 'var(--rocketAlt)' }}
></div>
<p> Playable in Browser</p>
</div>
<div>
<div 
  className="color-swatch" 
  style={{ backgroundColor: 'var(--rocketPurple)' }}
></div> <p> Playable with OpenAI Key</p>
</div>
<div>
<div 
  className="color-swatch" 
  style={{ backgroundColor: 'var(--rocketLight)' }}
></div> <p> Download to Run</p>
</div>
          </div>
        </div>
        

          <div className ="appBox">
            <nav className ="appNav">
              <h1 className = "gamesBox"  onClick={() => setActiveGrid("games")}>Games</h1>
              <h1 className = "utilsBox" onClick={() => setActiveGrid("utils")}>Utils</h1>
            </nav>
            {activeGrid === "games" && (
            <div className="games-grid" style={{ backgroundColor: "var(--rocketBlue)"}}>
          {games.map((game, index) => (
            <div
            key={index}
            className="game-card"
            onClick={() => navigate(game.path)}  
            style={{ backgroundColor: 
             game.type === "game" ? "var(--rocketAlt)" :
               game.type === "download" ? "var(--rocketLight)" :
              game.type === "openAI" ? "var(--rocketPurple)" : "white" }} >
              <div className="game-icon">{game.icon}</div>
              <h2>{game.name}</h2>
              <p>{game.description}</p>
            </div>
          ))}
        </div>)}
     {activeGrid === "utils" && (
            <div className="games-grid" style={{ backgroundColor: "var(--rocketDark)"}}>
          {utils.map((utils, index) => (
            <div
            key={index}
            className="utils-card"
            onClick={() => navigate(utils.path)}
             style={{ backgroundColor: 
             utils.type === "game" ? "var(--rocketAlt)" :
                       utils.type === "download" ? "var(--rocketLight)" :
              utils.type === "openAI" ? "var(--rocketPurple)" : "white" }} 
            >
              <div className="game-icon">{utils.icon}</div>
              <h2>{utils.name}</h2>
              <p>{utils.description}</p>
            </div>
          ))}
        </div>)}
        
          </div>
      </div>
    </div>
  );
}

export default Hub;

