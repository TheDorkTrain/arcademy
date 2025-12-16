import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Solitaire.css';
import '../../Hub.css';

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const rankValues = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

function Solitaire({ user, onLogout }) {
  const [deck, setDeck] = useState([]);
  const [stock, setStock] = useState([]);
  const [waste, setWaste] = useState([]);
  const [foundations, setFoundations] = useState([[], [], [], []]);
  const [tableau, setTableau] = useState([[], [], [], [], [], [], []]);
  const [selectedCards, setSelectedCards] = useState(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [difficulty, setDifficulty] = useState(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [draggedCards, setDraggedCards] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [history, setHistory] = useState([]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      const interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerActive]);

  // Create deck
  const createDeck = () => {
    const newDeck = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        newDeck.push({
          suit,
          rank,
          color: (suit === '♥' || suit === '♦') ? 'red' : 'black',
          faceUp: false,
          id: `${suit}-${rank}`
        });
      });
    });
    return shuffleDeck(newDeck);
  };

  // Shuffle deck
  const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Deal cards
  const dealCards = (drawCount) => {
    const newDeck = createDeck();
    const newTableau = [[], [], [], [], [], [], []];
    let cardIndex = 0;

    // Deal to tableau
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = { ...newDeck[cardIndex] };
        if (row === col) {
          card.faceUp = true;
        }
        newTableau[col].push(card);
        cardIndex++;
      }
    }

    // Remaining cards go to stock
    const remainingCards = newDeck.slice(cardIndex);
    
    setTableau(newTableau);
    setStock(remainingCards);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setSelectedCards(null);
    setMoves(0);
    setScore(0);
    setTime(0);
    setGameWon(false);
    setTimerActive(true);
  };

  // Start new game with difficulty
  const startNewGame = (diff) => {
    setDifficulty(diff);
    setShowDifficultyModal(false);
    setShowWinModal(false);
    setGameWon(false);
    setSelectedCards(null);
    setScore(0);
    setMoves(0);
    setTime(0);
    setTimerActive(true);
    setHistory([]);
    dealCards(diff);
  };

  // Draw from stock
  const drawFromStock = () => {
    if (stock.length === 0) {
      // Reset stock from waste
      if (waste.length > 0) {
        saveState();
        setStock([...waste].reverse().map(card => ({ ...card, faceUp: false })));
        setWaste([]);
        setMoves(prev => prev + 1);
      }
      return;
    }

    saveState();
    const cardsToDraw = Math.min(difficulty || 1, stock.length);
    const newStock = [...stock];
    const newWaste = [...waste];
    
    for (let i = 0; i < cardsToDraw; i++) {
      const card = { ...newStock[newStock.length - 1], faceUp: true };
      newWaste.push(card);
      newStock.pop();
    }
    
    setStock(newStock);
    setWaste(newWaste);
    setMoves(prev => prev + 1);
  };

  // Check if card can move to foundation
  const canMoveToFoundation = (card) => {
    const suitIndex = suits.indexOf(card.suit);
    const foundation = foundations[suitIndex];
    
    if (rankValues[card.rank] === 1) {
      return foundation.length === 0;
    }
    
    if (foundation.length === 0) return false;
    
    const topCard = foundation[foundation.length - 1];
    return rankValues[card.rank] === rankValues[topCard.rank] + 1;
  };

  // Move card to foundation
  const moveToFoundation = (card, fromLocation) => {
    if (!canMoveToFoundation(card)) return false;
    
    saveState();
    const suitIndex = suits.indexOf(card.suit);
    const newFoundations = [...foundations];
    newFoundations[suitIndex] = [...newFoundations[suitIndex], card];
    setFoundations(newFoundations);
    
    // Remove from source
    if (fromLocation.type === 'waste') {
      setWaste(prev => prev.slice(0, -1));
    } else if (fromLocation.type === 'tableau') {
      const newTableau = [...tableau];
      newTableau[fromLocation.index] = newTableau[fromLocation.index].slice(0, -1);
      
      // Flip top card if exists
      if (newTableau[fromLocation.index].length > 0) {
        const topCard = newTableau[fromLocation.index][newTableau[fromLocation.index].length - 1];
        if (!topCard.faceUp) {
          topCard.faceUp = true;
        }
      }
      setTableau(newTableau);
    }
    
    setScore(prev => prev + 10);
    setMoves(prev => prev + 1);
    return true;
  };

  // Check if cards can be placed on tableau
  const canPlaceOnTableau = (cards, targetPile) => {
    const movingCard = cards[0];
    
    if (targetPile.length === 0) {
      // Only kings can be placed on empty tableau piles
      return movingCard.rank === 'K';
    }
    
    const targetCard = targetPile[targetPile.length - 1];
    
    // Must be opposite color and one rank lower
    return (
      movingCard.color !== targetCard.color &&
      rankValues[movingCard.rank] === rankValues[targetCard.rank] - 1
    );
  };

  // Handle card click
  const handleCardClick = (card, location, event) => {
    // Shift + click to auto-move to foundation
    if (event.shiftKey) {
      moveToFoundation(card, location);
      return;
    }

    // Clear selection if clicking the same card
    if (selectedCards && selectedCards.cards[0].id === card.id) {
      setSelectedCards(null);
      return;
    }

    // If clicking on waste, only allow the top card
    if (location.type === 'waste') {
      if (waste.length > 0 && waste[waste.length - 1].id === card.id) {
        setSelectedCards({ cards: [card], from: location });
      }
      return;
    }

    // If clicking on tableau
    if (location.type === 'tableau') {
      const pile = tableau[location.index];
      const cardIndex = pile.findIndex(c => c.id === card.id);
      
      // Can only move face-up cards
      if (!pile[cardIndex].faceUp) return;
      
      const cardsToMove = pile.slice(cardIndex);
      setSelectedCards({ cards: cardsToMove, from: location });
    }
  };

  // Handle pile click
  const handlePileClick = (pileIndex) => {
    if (!selectedCards) return;
    
    const targetPile = tableau[pileIndex];
    
    if (canPlaceOnTableau(selectedCards.cards, targetPile)) {
      saveState();
      const newTableau = [...tableau];
      
      // Remove from source
      if (selectedCards.from.type === 'waste') {
        setWaste(prev => prev.slice(0, -1));
      } else if (selectedCards.from.type === 'tableau') {
        const sourcePile = newTableau[selectedCards.from.index];
        const firstCardIndex = sourcePile.findIndex(c => c.id === selectedCards.cards[0].id);
        newTableau[selectedCards.from.index] = sourcePile.slice(0, firstCardIndex);
        
        // Flip top card if exists
        if (newTableau[selectedCards.from.index].length > 0) {
          const topCard = newTableau[selectedCards.from.index][newTableau[selectedCards.from.index].length - 1];
          if (!topCard.faceUp) {
            topCard.faceUp = true;
          }
        }
      }
      
      // Add to target
      newTableau[pileIndex] = [...targetPile, ...selectedCards.cards];
      setTableau(newTableau);
      
      setScore(prev => prev + 5);
      setMoves(prev => prev + 1);
      setSelectedCards(null);
    }
  };

  // Check win condition
  useEffect(() => {
    const allCardsInFoundation = foundations.every(f => f.length === 13);
    if (allCardsInFoundation && !gameWon) {
      setGameWon(true);
      setShowWinModal(true);
      setTimerActive(false);
    }
  }, [foundations, gameWon]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save game state to history
  const saveState = () => {
    const state = {
      stock: JSON.parse(JSON.stringify(stock)),
      waste: JSON.parse(JSON.stringify(waste)),
      foundations: JSON.parse(JSON.stringify(foundations)),
      tableau: JSON.parse(JSON.stringify(tableau)),
      score,
      moves
    };
    setHistory(prev => [...prev, state].slice(-10)); // Keep last 10 moves
  };

  // Undo move
  const undoMove = () => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setStock(lastState.stock);
    setWaste(lastState.waste);
    setFoundations(lastState.foundations);
    setTableau(lastState.tableau);
    setScore(lastState.score);
    setMoves(lastState.moves);
    setHistory(prev => prev.slice(0, -1));
    setSelectedCards(null);
  };

  // Drag handlers
  const handleDragStart = (card, location, e) => {
    // Get all cards from this point down (for tableau)
    let cardsToMove = [card];
    
    if (location.type === 'tableau') {
      const pile = tableau[location.index];
      const cardIndex = pile.findIndex(c => c.id === card.id);
      cardsToMove = pile.slice(cardIndex);
      
      // Can only move face-up cards
      if (!cardsToMove[0].faceUp) {
        e.preventDefault();
        return;
      }
    } else if (location.type === 'waste') {
      // Only allow dragging the top waste card
      if (waste.length === 0 || waste[waste.length - 1].id !== card.id) {
        e.preventDefault();
        return;
      }
    }
    
    setDraggedCards(cardsToMove);
    setDraggedFrom(location);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (pileIndex, e) => {
    e.preventDefault();
    
    if (!draggedCards || !draggedFrom) return;
    
    const targetPile = tableau[pileIndex];
    
    if (canPlaceOnTableau(draggedCards, targetPile)) {
      saveState();
      const newTableau = [...tableau];
      
      // Remove from source
      if (draggedFrom.type === 'waste') {
        setWaste(prev => prev.slice(0, -1));
      } else if (draggedFrom.type === 'tableau') {
        const sourcePile = newTableau[draggedFrom.index];
        const firstCardIndex = sourcePile.findIndex(c => c.id === draggedCards[0].id);
        newTableau[draggedFrom.index] = sourcePile.slice(0, firstCardIndex);
        
        // Flip top card if exists
        if (newTableau[draggedFrom.index].length > 0) {
          const topCard = newTableau[draggedFrom.index][newTableau[draggedFrom.index].length - 1];
          if (!topCard.faceUp) {
            topCard.faceUp = true;
          }
        }
      }
      
      // Add to target
      newTableau[pileIndex] = [...targetPile, ...draggedCards];
      setTableau(newTableau);
      
      setScore(prev => prev + 5);
      setMoves(prev => prev + 1);
    }
    
    setDraggedCards(null);
    setDraggedFrom(null);
  };

  const handleDragEnd = () => {
    setDraggedCards(null);
    setDraggedFrom(null);
  };

  // Reset waste to stock when stock is empty
  const handleWasteClick = () => {
    if (stock.length === 0 && waste.length > 0) {
      saveState();
      setStock([...waste].reverse().map(card => ({ ...card, faceUp: false })));
      setWaste([]);
      setMoves(prev => prev + 1);
    }
  };

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
          <h1>🃏 Solitaire</h1>
          <h2>Classic Card Game</h2>
          <p>Clear all cards!</p>
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
          </div>
        )}
        
        <div>
          <Link to="/">
            <button className="logout-btn">Back to Hub</button>
          </Link>
        </div>
      </div>

      <div className="main-content">
        <div className="solitaire-container">
          {/* Header */}
          <div className="solitaire-header">
            <div className="solitaire-stats">
              <div>{formatTime(time)}</div>
              <div> Score: {score}</div>
              <div> Moves: {moves}</div>
            </div>
            <div className="solitaire-controls">
              <button 
                className="solitaire-btn" 
                onClick={undoMove}
                disabled={history.length === 0}
                style={{ opacity: history.length === 0 ? 0.5 : 1 }}
              >
                ↶ UNDO
              </button>
              <button className="solitaire-btn" onClick={() => setShowDifficultyModal(true)}>
                NEW
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="solitaire-game-area">
            {/* Top Area - Stock, Waste, Foundations */}
            <div className="solitaire-top-area">
              <div className="solitaire-stock-waste">
                {/* Stock */}
                <div 
                  className={`solitaire-stock ${stock.length === 0 ? 'empty' : ''}`}
                  onClick={drawFromStock}
                >
                  {stock.length > 0 ? 'DRAW' : '↻ RESET'}
                </div>

                {/* Waste */}
                <div 
                  className="solitaire-pile" 
                  style={{ width: '100px', position: 'relative' }}
                  onClick={handleWasteClick}
                >
                  {waste.length === 0 ? (
                    <div className="solitaire-empty-slot"></div>
                  ) : (
                    <>
                      {stock.length === 0 && (
                        <div 
                          className="reset-indicator"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '24px',
                            color: 'white',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            pointerEvents: 'none',
                            zIndex: 1000
                          }}
                        >
                          ↻ RESET
                        </div>
                      )}
                      {waste.slice(-(difficulty || 1)).map((card, idx) => (
                        <div
                          key={card.id}
                          draggable={idx === Math.min(difficulty || 1, waste.length) - 1}
                          onDragStart={(e) => {
                            if (idx === Math.min(difficulty || 1, waste.length) - 1) {
                              handleDragStart(card, { type: 'waste' }, e);
                            }
                          }}
                          onDragEnd={handleDragEnd}
                          className={`solitaire-card ${selectedCards?.cards[0]?.id === card.id ? 'selected' : ''}`}
                          style={{ 
                            left: `${idx * 20}px`,
                            zIndex: idx
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Only allow clicking the top card
                            if (idx === Math.min(difficulty || 1, waste.length) - 1) {
                              handleCardClick(card, { type: 'waste' }, e);
                            }
                          }}
                        >
                        <div className="card-top">
                          <span className={`card-rank ${card.color}`}>{card.rank}</span>
                          <span className={`card-suit ${card.color}`}>{card.suit}</span>
                        </div>
                        <div className="card-center">
                          <span className={`card-suit ${card.color}`}>{card.suit}</span>
                        </div>
                        <div className="card-bottom">
                          <span className={`card-rank ${card.color}`}>{card.rank}</span>
                          <span className={`card-suit ${card.color}`}>{card.suit}</span>
                        </div>
                      </div>
                    ))}
                    </>
                  )}
                </div>
              </div>

              {/* Foundations */}
              <div className="solitaire-foundations">
                {foundations.map((foundation, idx) => (
                  <div key={idx} className="solitaire-pile" style={{ width: '100px' }}>
                    {foundation.length === 0 ? (
                      <div className="solitaire-empty-slot foundation">{suits[idx]}</div>
                    ) : (
                      <div className="solitaire-card">
                        <div className="card-top">
                          <span className={`card-rank ${foundation[foundation.length - 1].color}`}>
                            {foundation[foundation.length - 1].rank}
                          </span>
                          <span className={`card-suit ${foundation[foundation.length - 1].color}`}>
                            {foundation[foundation.length - 1].suit}
                          </span>
                        </div>
                        <div className="card-center">
                          <span className={`card-suit ${foundation[foundation.length - 1].color}`}>
                            {foundation[foundation.length - 1].suit}
                          </span>
                        </div>
                        <div className="card-bottom">
                          <span className={`card-rank ${foundation[foundation.length - 1].color}`}>
                            {foundation[foundation.length - 1].rank}
                          </span>
                          <span className={`card-suit ${foundation[foundation.length - 1].color}`}>
                            {foundation[foundation.length - 1].suit}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tableau */}
            <div className="solitaire-tableau">
              {tableau.map((pile, pileIndex) => (
                <div 
                  key={pileIndex} 
                  className="solitaire-pile" 
                  style={{ minHeight: '400px', width: '100px' }}
                  onClick={() => handlePileClick(pileIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(pileIndex, e)}
                >
                  {pile.length === 0 ? (
                    <div className="solitaire-empty-slot"></div>
                  ) : (
                    pile.map((card, cardIndex) => (
                      <div
                        key={card.id}
                        draggable={card.faceUp}
                        onDragStart={(e) => {
                          if (card.faceUp) {
                            handleDragStart(card, { type: 'tableau', index: pileIndex }, e);
                          }
                        }}
                        onDragEnd={handleDragEnd}
                        className={`solitaire-card ${card.faceUp ? '' : 'face-down'} ${
                          selectedCards?.cards[0]?.id === card.id ? 'selected' : ''
                        }`}
                        style={{ 
                          top: `${cardIndex * 30}px`,
                          zIndex: cardIndex
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (card.faceUp) {
                            handleCardClick(card, { type: 'tableau', index: pileIndex }, e);
                          }
                        }}
                      >
                        {card.faceUp ? (
                          <>
                            <div className="card-top">
                              <span className={`card-rank ${card.color}`}>{card.rank}</span>
                              <span className={`card-suit ${card.color}`}>{card.suit}</span>
                            </div>
                            <div className="card-center">
                              <span className={`card-suit ${card.color}`}>{card.suit}</span>
                            </div>
                            <div className="card-bottom">
                              <span className={`card-rank ${card.color}`}>{card.rank}</span>
                              <span className={`card-suit ${card.color}`}>{card.suit}</span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Modal */}
          {showDifficultyModal && (
            <div className="difficulty-modal">
              <div className="difficulty-content">
                <h2>Start a new game?</h2>
                <div className="difficulty-options">
                  <button 
                    className="difficulty-option easy"
                    onClick={() => startNewGame(1)}
                  >
                    EASY
                  </button>
                  <button 
                    className="difficulty-option medium"
                    onClick={() => startNewGame(2)}
                  >
                    MEDIUM
                  </button>
                  <button 
                    className="difficulty-option hard"
                    onClick={() => startNewGame(3)}
                  >
                    HARD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Win Modal */}
          {showWinModal && (
            <div className="win-modal">
              <div className="win-content">
                <h2>🎉 You Win!</h2>
                <div className="win-stats">
                  <p><strong>Time:</strong> {formatTime(time)}</p>
                  <p><strong>Score:</strong> {score}</p>
                  <p><strong>Moves:</strong> {moves}</p>
                </div>
                <div className="win-buttons">
                  <button className="win-btn" onClick={() => startNewGame(difficulty)}>
                    Play Again
                  </button>
                  <button className="win-btn" onClick={() => setShowDifficultyModal(true)}>
                    New Difficulty
                  </button>
                  <Link to="/">
                    <button className="win-btn">
                      Back to Hub
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Solitaire;
