import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Bingo.css';
import '../../Hub.css';
import EggmanToken from '../../../assets/images/EggmanToken.png';

const EGGMAN_LIST = [
  "\"Hands off the keyboards\"",
  "\"Saw that coming\"",
  "\"Not errors, just undocumented features\"",
  "\"Go get your sugar, caffeine, Nicotine\"",
  "\"Ok, Trivia Question\"",
  "Mentions his son",
  "Mentions older neighbor",
  "\"I like you, I do\"",
  "Mention's Hitchhiker's Guide to the Galaxy",
  "Butchering somebody's name",
  "\"Ladies and Gentlemen\"",
  "\"Warning\"",
  "\"if you dont know, ASK\"",
  "mention of smalltalk",
  "\"dont want headlines in the wallstreet journal\"",
  "\"Ok... (Bad joke)\"",
  "\"For an extra 5 minutes of lunch\"",
  "Resets the VMs",
  "\"Now seems like a good time for a break\"",
  "Asks us to play cornucopia",
  "government work",
  "\"it depends\"",
  "\"Quiz doesn't work\"",
  "misspelling a word over and over and over",
  "Eats a boiled egg",
  "Can't find the right file",
  "\"you have been ___ right?\"",
  "Volunteers someone then answers himself",
  "\"You were just waiting for that, huh?\"",
  "\"who was my last volunteer?\"",
  "\"you should have seen look on __ face.\"",
  "\"I told you my jokes were bad\"",
  "\"classical music, like led zeppelin and pink floyd\"",
  "\"You can call on me, but I might give you homework\"",
  "\"Let's side step for a little\"",
  "\"User is a 4 letter word\"",
  "\"if you didn't write it down, it didn't happen\"",
  "\"now keep in mind\"",
  "Repeats a joke",
  "Questionable Joke",
  "playing a tv commercial video"
];

function Bingo({ user, onLogout, token }) {
  const [mode, setMode] = useState(null); // null, 'eggman', 'custom'
  const [board, setBoard] = useState([]);
  const [marked, setMarked] = useState([]);
  const [customItems, setCustomItems] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [winner, setWinner] = useState(false);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);

  const generateBoard = (items) => {
    // Shuffle and take 24 items (25 - 1 for free space)
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 24);
    
    // Insert items with free space in the middle
    const newBoard = [];
    for (let i = 0; i < 25; i++) {
      if (i === 12) { // Middle position (0-indexed)
        newBoard.push('FREE');
      } else if (i < 12) {
        newBoard.push(selected[i]);
      } else {
        newBoard.push(selected[i - 1]);
      }
    }
    
    setBoard(newBoard);
    setMarked([12]); // Mark free space by default
    setWinner(false);
  };

  const handleEggmanMode = () => {
    setMode('eggman');
    generateBoard(EGGMAN_LIST);
  };

  const handleCustomMode = () => {
    setMode('custom');
    setShowInput(true);
  };

  const handleCustomSubmit = () => {
    const items = customItems
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    if (items.length < 24) {
      alert('Please enter at least 24 items (one per line)');
      return;
    }
    
    generateBoard(items);
    setShowInput(false);
  };

  const toggleCell = (index) => {
    if (index === 12) return; // Can't toggle free space
    
    const newMarked = marked.includes(index)
      ? marked.filter(i => i !== index)
      : [...marked, index];
    
    setMarked(newMarked);
    checkWinner(newMarked);
  };

  const checkWinner = (markedCells) => {
    // Check rows
    for (let row = 0; row < 5; row++) {
      const rowStart = row * 5;
      const rowComplete = [0, 1, 2, 3, 4].every(col => 
        markedCells.includes(rowStart + col)
      );
      if (rowComplete) {
        setWinner(true);
        setShowWinnerOverlay(true);
        return;
      }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      const colComplete = [0, 1, 2, 3, 4].every(row => 
        markedCells.includes(row * 5 + col)
      );
      if (colComplete) {
        setWinner(true);
        setShowWinnerOverlay(true);
        return;
      }
    }
    
    // Check diagonals
    const diagonal1 = [0, 6, 12, 18, 24].every(i => markedCells.includes(i));
    const diagonal2 = [4, 8, 12, 16, 20].every(i => markedCells.includes(i));
    
    if (diagonal1 || diagonal2) {
      setWinner(true);
      setShowWinnerOverlay(true);
    }
  };

  const resetGame = () => {
    setMode(null);
    setBoard([]);
    setMarked([]);
    setCustomItems('');
    setShowInput(false);
    setWinner(false);
    setShowWinnerOverlay(false);
  };

  const regenerateBoard = () => {
    if (mode === 'eggman') {
      generateBoard(EGGMAN_LIST);
    } else if (mode === 'custom') {
      const items = customItems
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      generateBoard(items);
    }
    setShowWinnerOverlay(false);
  };

  const hideWinnerOverlay = () => {
    setShowWinnerOverlay(false);
  };

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
          <h1>🎲 Bingo</h1>
          <h2>By Nate</h2>
          <p>Classic Bingo Game</p>
        </div>

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
        
        <div>
          <Link to="/">
            <button className="logout-btn">Back to Hub</button>
          </Link>
        </div>
      </div>

      <div className="main-content">
        <div className="game-container">
          <div className="game-header">
            <h1>🎲 Bingo</h1>
          </div>

          <div className="game-content bingo-content">
            {!mode && (
              <div className="bingo-mode-select">
                <h2>Choose Your Bingo Mode</h2>
                <div className="mode-buttons">
                  <button 
                    className="mode-btn eggman-btn"
                    onClick={handleEggmanMode}
                  >
                    <img src={EggmanToken} alt="Eggman" className="mode-icon-img" />
                    <span className="mode-title">Eggman Bingo</span>
                    <span className="mode-desc">Classic phrases and moments</span>
                  </button>
                  <button 
                    className="mode-btn custom-btn"
                    onClick={handleCustomMode}
                  >
                    <span className="mode-icon">✏️</span>
                    <span className="mode-title">Make Your Own</span>
                    <span className="mode-desc">Create a custom board</span>
                  </button>
                </div>
              </div>
            )}

            {showInput && (
              <div className="custom-input-container">
                <h2>Enter Your Bingo Items</h2>
                <p>Enter at least 24 items (one per line)</p>
                <textarea
                  className="custom-textarea"
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  placeholder="Enter one item per line...&#10;Example:&#10;First item&#10;Second item&#10;Third item"
                  rows={15}
                />
                <div className="input-buttons">
                  <button className="submit-btn" onClick={handleCustomSubmit}>
                    Generate Board
                  </button>
                  <button className="cancel-btn" onClick={resetGame}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {mode && board.length > 0 && !showInput && (
              <div className="bingo-game">
                <div className="bingo-header-controls">
                  <h2>
                    {mode === 'eggman' ? (
                      <>
                        <img src={EggmanToken} alt="Eggman" className="header-icon-img" /> Eggman Bingo
                      </>
                    ) : (
                      '✏️ Custom Bingo'
                    )}
                  </h2>
                  <div className="game-controls">
                    <button className="control-btn" onClick={regenerateBoard}>
                      New Board
                    </button>
                    <button className="control-btn" onClick={resetGame}>
                      Main Menu
                    </button>
                  </div>
                </div>

                {winner && showWinnerOverlay && (
                  <div className="winner-overlay">
                    <div className="winner-content">
                      <div className="winner-banner">
                        🎉 BINGO! You Win! 🎉
                      </div>
                      <div className="winner-menu">
                        <button className="winner-btn-new" onClick={regenerateBoard}>
                          New Board
                        </button>
                        <button className="winner-btn-menu" onClick={resetGame}>
                          Main Menu
                        </button>
                        <button className="winner-btn-see" onClick={hideWinnerOverlay}>
                          See Board
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bingo-board">
                  {board.map((item, index) => (
                    <div
                      key={index}
                      className={`bingo-cell ${marked.includes(index) ? 'marked' : ''} ${
                        index === 12 ? 'free-space' : ''
                      } ${mode === 'eggman' ? 'eggman-mode' : ''}`}
                      onClick={() => toggleCell(index)}
                    >
                      {index === 12 ? (
                        <div className="free-text">
                          <strong>FREE</strong>
                          <br />
                          <small>SPACE</small>
                        </div>
                      ) : (
                        <span className="cell-text">{item}</span>
                      )}
                      {marked.includes(index) && index !== 12 && (
                        <div className="mark-overlay">✓</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bingo-instructions">
                  <p><strong>How to Play:</strong> Click on a cell to mark it when you hear/see that phrase or action!</p>
                  <p><strong>Win Condition:</strong> Complete any row, column, or diagonal to win!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bingo;
