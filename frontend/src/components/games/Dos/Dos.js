import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Dos.css';
import '../../Hub.css';

function Dos({ user, onLogout }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // Connection state
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Lobby state
  const [gameState, setGameState] = useState(roomId ? 'joining' : 'menu'); // 'menu', 'lobby', 'playing', 'joining'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  
  // Game state
  const [myHand, setMyHand] = useState([]);
  const [topCard, setTopCard] = useState(null);
  const [currentColor, setCurrentColor] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [drawStack, setDrawStack] = useState(0);
  const [direction, setDirection] = useState('clockwise');
  const [lastAction, setLastAction] = useState('');
  const [winner, setWinner] = useState(null);
  const [deckCount, setDeckCount] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [showChallengeButtons, setShowChallengeButtons] = useState(false);
  
  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedCardForColor, setSelectedCardForColor] = useState(null);
  const [showDrawConfirm, setShowDrawConfirm] = useState(false);
  const [notification, setNotification] = useState('');
  const [dosCalled, setDosCalled] = useState(false);
  const [challengeAvailable, setChallengeAvailable] = useState(null);
  
  // Connect to server on mount
  useEffect(() => {
    // Use the current host's IP for the socket connection
    // This allows connection from other devices on the network
    const socketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5004'
      : `http://${window.location.hostname}:5004`;
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to Dos server');
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from Dos server');
      setConnected(false);
    });
    
    newSocket.on('error', (data) => {
      showNotification(data.message, 'error');
    });
    
    // Lobby events
    newSocket.on('room_created', handleRoomCreated);
    newSocket.on('room_joined', handleRoomJoined);
    newSocket.on('player_joined', handlePlayerJoined);
    newSocket.on('player_left', handlePlayerLeft);
    newSocket.on('lobby_reset', handleLobbyReset);
    
    // Game events
    newSocket.on('game_started', handleGameStarted);
    newSocket.on('game_update', handleGameUpdate);
    newSocket.on('game_over', handleGameOver);
    newSocket.on('dos_called', handleDosCalled);
    newSocket.on('challenge_result', handleChallengeResult);
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, []);
  
  // Handle roomId changes (when navigating to /game/dos or /game/dos/:roomId)
  useEffect(() => {
    if (!roomId) {
      // Reset to menu when visiting /game/dos without a roomId
      setGameState('menu');
      setRoomCode('');
      setRoomName('');
      setPlayers([]);
      setIsHost(false);
      setWinner(null);
      setMyHand([]);
      setTopCard(null);
    }
  }, [roomId]);
  
  // Event handlers
  const handleRoomCreated = (data) => {
    setRoomCode(data.room_code);
    setRoomName(data.room_name || data.room_code);
    setPlayers(data.players);
    setIsHost(true);
    setGameState('lobby');
    navigate(`/game/dos/${data.room_code}`);
    showNotification(`Room created: ${data.room_code}`, 'success');
  };
  
  const handleRoomJoined = (data) => {
    setRoomCode(data.room_code);
    setRoomName(data.room_name || data.room_code);
    setPlayers(data.players);
    setGameState('lobby');
    navigate(`/game/dos/${data.room_code}`);
    showNotification(`Joined room: ${data.room_code}`, 'success');
  };
  
  const handlePlayerJoined = (data) => {
    setPlayers(data.players);
    showNotification(`${data.player_name} joined the game`, 'info');
  };
  
  const handlePlayerLeft = (data) => {
    showNotification(`${data.player_name} left the game`, 'info');
  };
  
  const handleLobbyReset = (data) => {
    setRoomCode(data.room_code);
    setRoomName(data.room_name);
    setPlayers(data.players);
    setGameState('lobby');
    setWinner(null);
    setMyHand([]);
    setTopCard(null);
    setCurrentPlayer(null);
    setIsMyTurn(false);
    setDrawStack(0);
    setLastAction('');
    setDosCalled(false);
    setShowChallengeButtons(false);
    showNotification('Game reset! Ready to play again?', 'success');
  };
  
  const handleGameStarted = (data) => {
    setGameState('playing');
    setMyHand(data.your_hand);
    setTopCard(data.top_card);
    setCurrentColor(data.current_color);
    setCurrentPlayer(data.current_player);
    setIsMyTurn(data.your_turn);
    setDrawStack(data.draw_stack);
    setDirection(data.direction);
    setPlayers(data.players);
    setLastAction(data.last_action);
    setDeckCount(data.deck_count || 0);
    showNotification('Game started!', 'success');
  };
  
  const handleGameUpdate = (data) => {
    setMyHand(data.your_hand);
    setTopCard(data.top_card);
    setCurrentColor(data.current_color);
    setCurrentPlayer(data.current_player);
    setIsMyTurn(data.your_turn);
    setDrawStack(data.draw_stack);
    setDirection(data.direction);
    setPlayers(data.players);
    setLastAction(data.last_action);
    setDeckCount(data.deck_count || 0);
    
    // Check if any player has 1 card (show challenge option)
    const playerWith1Card = data.players.find(p => p.card_count === 1);
    if (playerWith1Card && !data.dos_called_by?.includes(playerWith1Card.id)) {
      setChallengeTarget(playerWith1Card.id);
      setShowChallengeButtons(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowChallengeButtons(false), 5000);
    }
    
    // Reset DOS call if hand size changes
    if (data.your_hand.length !== 1) {
      setDosCalled(false);
    }
  };
  
  const handleGameOver = (data) => {
    setWinner(data.winner);
    showNotification(`${data.winner} wins!`, 'success');
  };
  
  const handleDosCalled = (data) => {
    showNotification(`${data.player_name} called DOS!`, 'info');
    setShowChallengeButtons(false);
  };
  
  const handleChallengeResult = (data) => {
    showNotification(data.message, 'info');
    setShowChallengeButtons(false);
  };
  
  // Actions
  const createRoom = () => {
    if (!playerName.trim()) {
      showNotification('Please enter your name', 'error');
      return;
    }
    // Use room name as code if provided, otherwise let backend generate random code
    const customRoomName = roomName.trim();
    socket.emit('create_room', { 
      name: playerName, 
      room_name: customRoomName,
      use_name_as_code: !!customRoomName 
    });
  };
  
  const joinRoom = () => {
    if (!playerName.trim()) {
      showNotification('Please enter your name', 'error');
      return;
    }
    const codeToJoin = roomId || roomCode.trim();
    if (!codeToJoin) {
      showNotification('Please enter a room code', 'error');
      return;
    }
    socket.emit('join_room', { name: playerName, room_code: codeToJoin });
  };
  
  const playAgain = () => {
    if (socket && roomCode) {
      socket.emit('play_again', { room_code: roomCode, room_name: roomName });
      setWinner(null);
      setGameState('lobby');
      setMyHand([]);
      setTopCard(null);
      setCurrentPlayer(null);
      setIsMyTurn(false);
      setDrawStack(0);
      setLastAction('');
      setDosCalled(false);
      setShowChallengeButtons(false);
    }
  };
  
  const createNewLobby = () => {
    setWinner(null);
    setGameState('menu');
    setRoomCode('');
    setRoomName('');
    navigate('/game/dos');
  };
  
  const startGame = () => {
    socket.emit('start_game');
  };
  
  const playCard = (card) => {
    if (!isMyTurn) {
      showNotification('Not your turn!', 'error');
      return;
    }
    
    // Check if wild card needs color selection
    if (card.type === 'wild' || card.type === 'wild_draw_four') {
      setSelectedCardForColor(card);
      setShowColorPicker(true);
      return;
    }
    
    socket.emit('play_card', { card_id: card.id });
  };
  
  const playCardWithColor = (color) => {
    if (selectedCardForColor) {
      socket.emit('play_card', { 
        card_id: selectedCardForColor.id, 
        color: color 
      });
      setShowColorPicker(false);
      setSelectedCardForColor(null);
    }
  };
  
  const drawCard = () => {
    if (!isMyTurn) {
      showNotification('Not your turn!', 'error');
      return;
    }
    const cardsToDraw = drawStack > 0 ? drawStack : 1;
    showNotification(`Drawing ${cardsToDraw} card${cardsToDraw > 1 ? 's' : ''}...`, 'info');
    socket.emit('draw_card');
  };
  
  const callDos = () => {
    if (myHand.length <= 2) {
      socket.emit('call_dos');
      setDosCalled(true);
      setShowChallengeButtons(false);
      showNotification('DOS!', 'success');
    }
  };
  
  const challengeDos = () => {
    if (challengeTarget) {
      socket.emit('challenge_dos', { challenged_id: challengeTarget });
      setShowChallengeButtons(false);
      setChallengeTarget(null);
    }
  };
  
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 3000);
  };
  
  // Render functions
  const getCardEmoji = (card) => {
    const emojiMap = {
      'skip': '🚫',
      'reverse': '🔄',
      'draw_two': '+2️⃣',
      'wild': '🌈',
      'wild_draw_four': '🌈+4️⃣'
    };
    return emojiMap[card.type] || card.value;
  };

  const renderCard = (card, onClick = null, style = {}) => {
    const cardColor = card.color === 'wild' ? 'black' : card.color;
    const isWild = card.type === 'wild' || card.type === 'wild_draw_four';
    const isSpecial = ['skip', 'reverse', 'draw_two', 'wild', 'wild_draw_four'].includes(card.type);
    
    return (
      <div
        className={`dos-card ${cardColor} ${onClick ? 'playable' : ''}`}
        onClick={onClick}
        style={style}
      >
        {isWild && (
          <div className="wild-quarters">
            <div className="quarter red"></div>
            <div className="quarter yellow"></div>
            <div className="quarter green"></div>
            <div className="quarter blue"></div>
          </div>
        )}
        <div className="card-value">
          {isSpecial ? getCardEmoji(card) : card.value}
        </div>
      </div>
    );
  };
  
  const getPlayerPosition = (index, total) => {
    // Calculate position in circle for 8 players
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 220;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` };
  };
  
  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="hub-container">
        <div className="sidebar">
          <div>
            <h1>🎴 DOS</h1>
            <h2>Multiplayer Card Game</h2>
            <p>Up to 8 players!</p>
          </div>
          {user ? (
            <div className="user-info">
              <p>Welcome, {user.username}!</p>
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <div className="user-info">
              <p>Welcome, Guest!</p>
              <Link to="/login"><button className="logout-btn">Login</button></Link>
              {' '}
              <Link to="/register"><button className="logout-btn">Register</button></Link>
            </div>
          )}
          <div>
            <Link to="/"><button className="logout-btn">Back to Hub</button></Link>
          </div>
        </div>
        
        <div className="main-content">
          <div className="dos-menu">
            {!connected && (
              <div className="connection-status error">
                ⚠️ Not connected to server
              </div>
            )}
            
            <h1>🎴 DOS Multiplayer</h1>
            
            <div className="menu-container">
              {/* Name Section */}
              <div className="menu-section">
                <h3>Player Name</h3>
                <div className="dos-menu-card">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="dos-input"
                    maxLength={12}
                  />
                  <button 
                    className="dos-btn save-name" 
                    onClick={() => playerName.trim() && showNotification(`Name saved: ${playerName}`, 'success')}
                    disabled={!playerName.trim()}
                  >
                    Save Name
                  </button>
                </div>
              </div>
              
              {/* Lobby Section */}
              <div className="menu-section">
                <h3>Lobbies</h3>
                <div className="dos-menu-card">
                  <div className="lobby-section">
                    <h4>Create Lobby</h4>
                    <input
                      type="text"
                      placeholder="Custom Room Code (Optional)"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="dos-input"
                      maxLength={20}
                    />
                    <p className="input-hint">Leave empty for random code</p>
                    <button 
                      className="dos-btn create" 
                      onClick={createRoom}
                      disabled={!playerName.trim() || !connected}
                    >
                      Create Room
                    </button>
                  </div>
                  
                  <div className="lobby-divider"></div>
                  
                  <div className="lobby-section">
                    <h4>Join Lobby</h4>
                    <input
                      type="text"
                      placeholder="Room Code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="dos-input"
                      maxLength={20}
                    />
                    <button 
                      className="dos-btn join" 
                      onClick={joinRoom}
                      disabled={!playerName.trim() || !connected}
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Lobby screen
  if (gameState === 'lobby') {
    return (
      <div className="hub-container">
        <div className="sidebar">
          <div>
            <h1>🎴 DOS</h1>
            <h2>Room: {roomCode}</h2>
            <p>{players.length}/8 Players</p>
          </div>
          <div>
            <Link to="/"><button className="logout-btn">Leave Room</button></Link>
          </div>
        </div>
        
        <div className="main-content">
          <div className="dos-lobby">
            <h1>Room Code: {roomCode}</h1>
            <p className="share-code">Share this code with friends!</p>
            
            <div className="players-waiting">
              <h2>Players ({players.length}/8)</h2>
              <div className="player-list">
                {players.map((player, index) => (
                  <div key={player.id} className="lobby-player">
                    <span className="player-icon">👤</span>
                    <span className="player-name">{player.name}</span>
                    {player.is_host && <span className="host-badge">HOST</span>}
                  </div>
                ))}
              </div>
            </div>
            
            {isHost && (
              <button 
                className="dos-btn start-game" 
                onClick={startGame}
                disabled={players.length < 2}
              >
                {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
              </button>
            )}
            
            {!isHost && (
              <p className="waiting-message">Waiting for host to start...</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Game screen
  return (
    <div className="dos-game-wrapper">
      {/* YOUR TURN Indicator at Top */}
      {isMyTurn && (
        <div className="top-turn-indicator">
          ⭐ YOUR TURN ⭐
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`dos-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Winner Modal */}
      {winner && (
        <div className="dos-modal">
          <div className="modal-content">
            <h2>🎉 {winner} Wins!</h2>
            <div className="winner-buttons">
              <button className="dos-btn play-again" onClick={playAgain}>
                🔄 Play Again
              </button>
              <button className="dos-btn new-lobby" onClick={createNewLobby}>
                ➕ New Lobby
              </button>
              <Link to="/">
                <button className="dos-btn main-menu">
                  🏠 Main Menu
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="dos-modal">
          <div className="modal-content color-picker">
            <h2>Choose a Color</h2>
            <div className="color-options">
              {['red', 'yellow', 'green', 'blue'].map(color => (
                <button
                  key={color}
                  className={`color-btn ${color}`}
                  onClick={() => playCardWithColor(color)}
                >
                  {color.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Game Layout */}
      <div className="dos-game-container">
        {/* Left Sidebar - Game Info */}
        <div className="game-sidebar">
          <div className="room-info">
            <h2>🎴 DOS</h2>
            <p className="room-code">Room: {roomCode}</p>
          </div>
          
          <div className="game-status-box">
            <h3>Current Turn</h3>
            <div className="status-value">
              {currentPlayer}
              {isMyTurn && <span className="your-turn-badge">YOU</span>}
            </div>
          </div>
          
          <div className="game-status-box">
            <h3>Direction</h3>
            <div className="status-value">
              {direction === 'clockwise' ? '🔄 Clockwise' : '🔃 Counter'}
            </div>
          </div>
          
          {drawStack > 0 && (
            <div className="game-status-box draw-stack-box">
              <h3>Draw Stack</h3>
              <div className="status-value draw-stack-value">+{drawStack}</div>
            </div>
          )}
          
          <div className="game-status-box last-action-box">
            <h3>Last Action</h3>
            <div className="status-value last-action-text">
              {lastAction || 'Game just started'}
            </div>
          </div>
          
          <div className="game-status-box deck-count-box">
            <h3>Cards in Deck</h3>
            <div className="status-value deck-count-value">
              🎴 {deckCount}
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="game-action-btn draw-btn" 
              onClick={drawCard}
              disabled={!isMyTurn}
            >
              🃏 DRAW {drawStack > 0 ? `+${drawStack}` : ''}
            </button>
          </div>
          
          <Link to="/game/dos" className="leave-link">
            <button className="leave-btn">← Back to Menu</button>
          </Link>
          
          <Link to="/" className="leave-link">
            <button className="hub-btn">🏠 Back to Hub</button>
          </Link>
        </div>
        
        {/* Center - Game Board */}
        <div className="game-center">
          <div className="game-board">
            {/* Other players in circle */}
            <div className="players-circle">
              {players.map((player, index) => {
                const pos = getPlayerPosition(index, players.length);
                const isCurrent = player.name === currentPlayer;
                return (
                  <div
                    key={player.id}
                    className={`player-spot ${isCurrent ? 'current-turn' : ''}`}
                    style={pos}
                  >
                    <div className="player-name">{player.name}</div>
                    <div className="player-cards">🎴 {player.card_count}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Center play area */}
            <div className="play-area">
              <div className="deck-area">
                <div 
                  className={`deck ${isMyTurn ? 'clickable' : ''}`}
                  onClick={() => isMyTurn && drawCard()}
                  title={isMyTurn ? `Draw ${drawStack > 0 ? drawStack : 1} card${drawStack !== 1 ? 's' : ''}` : 'Not your turn'}
                >
                  <div className="card-back">🎴<br/>DRAW</div>
                </div>
                {topCard && (
                  <div className="discard-pile">
                    {renderCard({ ...topCard, color: currentColor })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Player's hand - Fan layout */}
          <div className="player-hand-section">
            {/* DOS and Challenge buttons above hand */}
            {showChallengeButtons && (
              <div className="hand-action-buttons">
                <button className="hand-action-btn challenge-btn" onClick={challengeDos}>
                  ⚠️ CHALLENGE DOS
                </button>
              </div>
            )}
            
            {myHand.length <= 2 && !dosCalled && (
              <div className="hand-action-buttons">
                <button className="hand-action-btn dos-call-btn" onClick={callDos}>
                  🔔 CALL DOS!
                </button>
              </div>
            )}
            
            <div className="hand-cards-fan">
              {myHand.map((card, index) => (
                <div
                  key={card.id}
                  className="hand-card-wrapper"
                  style={{ 
                    zIndex: index
                  }}
                >
                  {renderCard(card, isMyTurn ? () => playCard(card) : null)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dos;
