import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './Paintball.css';
import '../../Hub.css';
import { CHARACTER_CARDS } from './assets/characters';
import { MAP_CARDS } from './assets/maps';

const INPUT_KEYS = {
  up: ['w', 'arrowup'],
  down: ['s', 'arrowdown'],
  left: ['a', 'arrowleft'],
  right: ['d', 'arrowright']
};

function Paintball({ user, onLogout }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const inputRef = useRef({ up: false, down: false, left: false, right: false });
  const aimRef = useRef(0);

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [maps, setMaps] = useState(MAP_CARDS);
  const [characters, setCharacters] = useState(CHARACTER_CARDS);
  const [selectedCharacter, setSelectedCharacter] = useState('sprinter');
  const [mapVotes, setMapVotes] = useState({});
  const [roundsToPlay, setRoundsToPlay] = useState(3);
  const [notification, setNotification] = useState('');
  const [gameData, setGameData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [roundResult, setRoundResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [characterImages, setCharacterImages] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [roundTransition, setRoundTransition] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Load character images
  useEffect(() => {
    const loadImages = async () => {
      const images = {};
      for (const char of CHARACTER_CARDS) {
        const img = new Image();
        img.src = char.sprite;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        images[char.id] = img;
      }
      setCharacterImages(images);
      setImagesLoaded(true);
    };
    loadImages();
  }, []);

  const mergeMaps = useCallback((serverMaps) => {
    if (!serverMaps || serverMaps.length === 0) {
      return MAP_CARDS;
    }
    const details = Object.fromEntries(MAP_CARDS.map((map) => [map.id, map]));
    return serverMaps.map((map) => ({
      ...details[map.id],
      ...map,
      description: details[map.id]?.description || map.description || 'Vote for this map.',
      previewColor: details[map.id]?.previewColor || map.previewColor || '#1e293b'
    }));
  }, []);

  const mergeCharacters = useCallback((serverCharacters) => {
    if (!serverCharacters || serverCharacters.length === 0) {
      return CHARACTER_CARDS;
    }
    const details = Object.fromEntries(CHARACTER_CARDS.map((char) => [char.id, char]));
    return serverCharacters.map((char) => ({
      ...details[char.id],
      ...char,
      sprite: details[char.id]?.sprite
    }));
  }, []);

  const handleRoomCreated = useCallback((data) => {
    setRoomCode(data.room_code);
    setRoomName(data.room_name || data.room_code);
    setPlayers(data.players || []);
    setIsHost(true);
  setMaps(mergeMaps(data.maps));
  setCharacters(mergeCharacters(data.characters));
    setRoundsToPlay(data.rounds_to_play || 3);
    setChatMessages([]); // Reset chat on new room
    setGameState('lobby');
    navigate(`/game/paintball/${data.room_code}`);
  }, [navigate, mergeMaps, mergeCharacters]);

  const handleRoomJoined = useCallback((data) => {
    setRoomCode(data.room_code);
    setRoomName(data.room_name || data.room_code);
    setPlayers(data.players || []);
  setMaps(mergeMaps(data.maps));
  setCharacters(mergeCharacters(data.characters));
    setRoundsToPlay(data.rounds_to_play || 3);
    setChatMessages([]); // Reset chat on join
    setGameState('lobby');
    navigate(`/game/paintball/${data.room_code}`);
  }, [navigate, mergeMaps, mergeCharacters]);

  const handlePlayerJoined = useCallback((data) => {
    setPlayers(data.players || []);
  }, []);

  const handlePlayerLeft = useCallback((data) => {
    setPlayers(data.players || []);
  }, []);

  const handleLobbySettings = useCallback((data) => {
    setRoundsToPlay(data.rounds_to_play);
  }, []);

  const handleMapVotes = useCallback((data) => {
    setMapVotes(data.votes || {});
  }, []);

  const handlePlayerUpdate = useCallback((data) => {
    setPlayers(data.players || []);
  }, []);

  const handleGameStarted = useCallback((data) => {
    setGameData(data);
    setRoundResult(null);
    setMatchResult(null);
    setRoundTransition({ type: 'start', round: data.round });
    setGameState('playing');
    setTimeout(() => setRoundTransition(null), 2000);
  }, []);

  const handleGameUpdate = useCallback((data) => {
    setGameData(data);
  }, []);

  const handleRoundEnded = useCallback((data) => {
    setRoundResult(data);
    setRoundTransition({ type: 'end', round: data.round, winner: data.winner });
    setTimeout(() => setRoundTransition(null), 3000);
  }, []);

  const handleRoundStarted = useCallback((data) => {
    setGameData(data);
    setRoundResult(null);
    setRoundTransition({ type: 'start', round: data.round });
    setTimeout(() => setRoundTransition(null), 2000);
  }, []);

  const handleMatchOver = useCallback((data) => {
    setMatchResult(data.results || []);
  }, []);

  const handleChatMessage = useCallback((data) => {
    setChatMessages((prev) => [...prev.slice(-99), data]);
  }, []);

  const handlePlayerHit = useCallback((data) => {
    if (!data?.shooter_name || !data?.target_name) {
      return;
    }
    setChatMessages((prev) => [
      ...prev.slice(-99),
      {
        player: 'Elimination',
        message: `${data.shooter_name} eliminated ${data.target_name}`,
        timestamp: Date.now()
      }
    ]);
  }, []);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5006'
      : `http://${window.location.hostname}:5006`;

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setSocketId(newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      setSocketId(null);
    });

    newSocket.on('error', (data) => {
      setNotification(data.message || 'Server error');
    });

    newSocket.on('room_created', handleRoomCreated);
    newSocket.on('room_joined', handleRoomJoined);
    newSocket.on('player_joined', handlePlayerJoined);
    newSocket.on('player_left', handlePlayerLeft);
    newSocket.on('lobby_settings', handleLobbySettings);
    newSocket.on('map_votes', handleMapVotes);
    newSocket.on('player_update', handlePlayerUpdate);

    newSocket.on('game_started', handleGameStarted);
    newSocket.on('game_update', handleGameUpdate);
    newSocket.on('round_ended', handleRoundEnded);
    newSocket.on('round_started', handleRoundStarted);
    newSocket.on('match_over', handleMatchOver);

    newSocket.on('chat_message', handleChatMessage);
    newSocket.on('player_hit', handlePlayerHit);

    setSocket(newSocket);

    return () => newSocket.close();
  }, [
    handleChatMessage,
    handleGameStarted,
    handleGameUpdate,
    handleLobbySettings,
    handleMapVotes,
    handleMatchOver,
    handlePlayerJoined,
    handlePlayerLeft,
    handlePlayerUpdate,
    handleRoomCreated,
    handleRoomJoined,
    handleRoundEnded,
    handleRoundStarted,
    handlePlayerHit
  ]);

  useEffect(() => {
    if (!roomId) {
      setGameState('menu');
      setRoomCode('');
      setRoomName('');
      setPlayers([]);
      setIsHost(false);
      setGameData(null);
      setMatchResult(null);
      setRoundResult(null);
      return;
    }
    
    // Auto-join when URL has roomId and we have a socket connection
    // Only attempt join if we're in menu state and haven't joined yet
    if (socket && connected && playerName.trim() && gameState === 'menu' && players.length === 0) {
      const codeToJoin = roomId.toUpperCase();
      setRoomCode(codeToJoin);
      socket.emit('join_room', { name: playerName, room_code: codeToJoin });
    } else if (gameState === 'menu') {
      setRoomCode(roomId.toUpperCase());
    }
  }, [roomId, socket, connected, playerName]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData?.map || !imagesLoaded) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = gameData.map;
    
    // Scale canvas to fit screen while maintaining aspect ratio
    const maxWidth = window.innerWidth - 400; // Account for sidebar
    const maxHeight = window.innerHeight - 200; // Account for header/controls
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width * scale}px`;
    canvas.style.height = `${height * scale}px`;

    ctx.clearRect(0, 0, width, height);
    
    // Apply zoom transformation centered on player
    const me = gameData.players.find((p) => p.id === socket.id);
    if (me && zoomLevel !== 1.0) {
      ctx.save();
      // Center zoom on player position
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(-me.x, -me.y);
    }
    
    // Use map-specific background color or default
    ctx.fillStyle = gameData.map.background_color || '#12263a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#2f4c6b';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Draw obstacles
    if (gameData.map.obstacles) {
      gameData.map.obstacles.forEach((obstacle) => {
        ctx.fillStyle = obstacle.color || '#2f4c6b';
        if (obstacle.type === 'rect') {
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          // Add border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else if (obstacle.type === 'circle') {
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
          ctx.fill();
          // Add border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    // Draw projectiles
    if (gameData.projectiles) {
      gameData.projectiles.forEach((proj) => {
        const projectileColor = proj.color || '#fbbf24';
        ctx.fillStyle = projectileColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = projectileColor;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    // Draw barriers
    if (gameData.barriers) {
      gameData.barriers.forEach((barrier) => {
        const healthPercent = barrier.health / barrier.max_health;
        ctx.fillStyle = `rgba(148, 163, 184, ${0.3 + healthPercent * 0.5})`;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(barrier.x, barrier.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw shield icon or health indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', barrier.x, barrier.y);
      });
    }

    // Draw players
    gameData.players.forEach((player) => {
      if (!player.alive) return;
      
      // Apply phase effect if Phase character is using ability
      if (player.character === 'phase' && player.ability_active) {
        ctx.globalAlpha = 0.4; // Semi-transparent when phasing
      }
      
      const img = characterImages[player.character];
      if (img && img.complete) {
        // Draw character sprite
        const size = 36;  // Made slightly smaller for better fit
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.aim + Math.PI / 2); // Rotate to face aim direction
        
        // Add purple glow for Phase ability
        if (player.character === 'phase' && player.ability_active) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#a855f7';
        }
        
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        // Fallback circle if image not loaded
        ctx.fillStyle = player.color || '#f97316';
        
        // Add purple glow for Phase ability
        if (player.character === 'phase' && player.ability_active) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#a855f7';
        }
        
        ctx.beginPath();
        ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);  // Thinner
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Reset alpha
      ctx.globalAlpha = 1.0;

      // Draw name label
      const labelText = player.name;
      ctx.font = '11px sans-serif';  // Slightly smaller
      const textWidth = ctx.measureText(labelText).width;
      const labelX = player.x - textWidth / 2;
      const labelY = player.y - 35;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(labelX - 4, labelY - 10, textWidth + 8, 14);
      ctx.fillStyle = player.color || '#fff';
      ctx.fillText(labelText, labelX, labelY);

      // Draw health bar
      const barWidth = 40;
      const barHeight = 4;
      const barX = player.x - barWidth / 2;
      const barY = player.y + 25;
      const healthPercent = player.health / player.max_health;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    });
    
    // Restore context if zoom was applied
    if (me && zoomLevel !== 1.0) {
      ctx.restore();
    }
  }, [gameData, imagesLoaded, characterImages, socket, zoomLevel]);

  useEffect(() => {
    if (gameState !== 'playing' || !gameData) {
      cancelAnimationFrame(animationRef.current);
      return;
    }

    const render = () => {
      drawGame();
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationRef.current);
  }, [drawGame, gameState, gameData]);

  useEffect(() => {
    if (gameState !== 'playing' || !socket) {
      return;
    }

    const interval = setInterval(() => {
      const input = inputRef.current;
      const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      socket.emit('player_move', { move_x: moveX, move_y: moveY });
      socket.emit('player_aim', { aim: aimRef.current });
    }, 60);

    return () => clearInterval(interval);
  }, [gameState, socket]);

  const createRoom = () => {
    if (!playerName.trim()) {
      setNotification('Please enter your name');
      return;
    }
    const customRoomName = roomName.trim();
    // Clear any existing room state and reset chat
    setChatMessages([]);
    setGameState('menu'); // Stay in menu until room is confirmed
    socket.emit('create_room', {
      name: playerName,
      room_name: customRoomName,
      use_name_as_code: !!customRoomName
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setNotification('Please enter your name');
      return;
    }
  const codeToJoin = (roomId || roomCode.trim()).toUpperCase();
    if (!codeToJoin) {
      setNotification('Please enter a room code');
      return;
    }
    socket.emit('join_room', { name: playerName, room_code: codeToJoin });
  };

  const updateRounds = (value) => {
    setRoundsToPlay(value);
    if (isHost) {
      socket.emit('update_lobby_settings', { rounds_to_play: value });
    }
  };

  const selectCharacter = (characterId) => {
    setSelectedCharacter(characterId);
    socket.emit('select_character', { character: characterId });
  };

  const voteMap = (mapId) => {
    if (!socketId) return;
    setMapVotes((prev) => ({ ...prev, [socketId]: mapId }));
    socket.emit('vote_map', { map_id: mapId });
  };

  const startGame = () => {
    socket.emit('start_game');
  };

  const sendChat = () => {
    if (!chatInput.trim()) {
      return;
    }
    socket.emit('chat_message', { message: chatInput.trim() });
    setChatInput('');
  };

  const onKeyDown = (event) => {
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      return;
    }
    const key = event.key.toLowerCase();
    if (INPUT_KEYS.up.includes(key)) inputRef.current.up = true;
    if (INPUT_KEYS.down.includes(key)) inputRef.current.down = true;
    if (INPUT_KEYS.left.includes(key)) inputRef.current.left = true;
    if (INPUT_KEYS.right.includes(key)) inputRef.current.right = true;
    if (key === ' ') {
      event.preventDefault();
      socket.emit('shoot', { aim: aimRef.current });
    }
    if (key === 'q') {
      event.preventDefault();
      socket.emit('activate_ability');
    }
  };

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (INPUT_KEYS.up.includes(key)) inputRef.current.up = false;
    if (INPUT_KEYS.down.includes(key)) inputRef.current.down = false;
    if (INPUT_KEYS.left.includes(key)) inputRef.current.left = false;
    if (INPUT_KEYS.right.includes(key)) inputRef.current.right = false;
  };

  const onMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;
    const rect = canvas.getBoundingClientRect();
    
    // Get canvas scale
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate mouse position in canvas coordinates
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    const me = gameData.players.find((p) => p.id === socket.id);
    if (!me) return;
    const dx = canvasX - me.x;
    const dy = canvasY - me.y;
    aimRef.current = Math.atan2(dy, dx);
  };

  const onRightClick = (event) => {
    event.preventDefault(); // Prevent context menu
    if (socket && gameData) {
      socket.emit('shoot', { aim: aimRef.current });
    }
  };

  const onWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1; // Zoom out on scroll down, zoom in on scroll up
    setZoomLevel((prev) => Math.max(1.0, Math.min(2.0, prev + delta)));
  };

  if (gameState === 'menu') {
    return (
      <div className="hub-container">
        <div className="sidebar">
          <div>
            <h1>Paintball</h1>
            <h2>Multiplayer Arena</h2>
            <p>Up to 8 players</p>
          </div>
          <div>
            <Link to="/"><button className="logout-btn">Back to Hub</button></Link>
          </div>
        </div>
        <div className="main-content">
          <div className="paintball-menu">
            {notification && <div className="connection-status error">{notification}</div>}
            {!connected && <div className="connection-status error">⚠️ Not connected to server</div>}
            <h1>Paintball Arena</h1>
            <div className="menu-container">
              <div className="menu-section">
                <h3>Player Name</h3>
                <div className="paintball-card">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="paintball-input"
                    maxLength={12}
                  />
                </div>
              </div>
              <div className="menu-section">
                <h3>Lobbies</h3>
                <div className="paintball-card">
                  <div className="lobby-section">
                    <h4>Create Lobby</h4>
                    <input
                      type="text"
                      placeholder="Custom Room Code (Optional)"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="paintball-input"
                      maxLength={20}
                    />
                    <p className="input-hint">Leave empty for random code</p>
                    <button className="paintball-btn" onClick={createRoom}>
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
                      className="paintball-input"
                      maxLength={20}
                    />
                    <button className="paintball-btn secondary" onClick={joinRoom}>
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

  if (gameState === 'lobby') {
    return (
      <div className="hub-container">
        <div className="sidebar">
          <div>
            <h1>🎯 Paintball</h1>
            <h2>Room: {roomCode}</h2>
            <p>{players.length}/8 Players</p>
          </div>
          <div className="sidebar-chat">
            <h3>Lobby Chat</h3>
            <div className="chat-box">
              {chatMessages.map((msg, index) => (
                <div key={`${msg.timestamp}-${index}`} className="chat-message">
                  <strong style={{ color: msg.color || '#fff' }}>{msg.player}:</strong> {msg.message}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              />
              <button onClick={sendChat}>Send</button>
            </div>
          </div>
          <div>
            <Link to="/game/paintball"><button className="logout-btn">Leave Room</button></Link>
          </div>
        </div>
        <div className="main-content">
          <div className="paintball-lobby">
            <h1>Room Code: {roomCode}</h1>
            <p className="share-code">Share this code with friends!</p>
            <div className="lobby-grid">
              <div className="lobby-panel">
                <h3>Players</h3>
                <div className="player-list">
                  {players.map((player) => (
                    <div key={player.id} className="lobby-player">
                      <span style={{ color: player.color || '#fff' }}>{player.name}</span>
                      <span className="player-role">{player.is_host ? 'HOST' : player.character}</span>
                    </div>
                  ))}
                </div>
                <div className="round-select">
                  <label>Rounds to Play</label>
                  <select
                    value={roundsToPlay}
                    onChange={(e) => updateRounds(Number(e.target.value))}
                    disabled={!isHost}
                  >
                    {[1, 3, 5, 7, 9].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                {isHost && (
                  <button className="paintball-btn" onClick={startGame} disabled={players.length < 2}>
                    {players.length < 2 ? 'Waiting for players...' : 'Start Match'}
                  </button>
                )}
              </div>
              <div className="lobby-panel">
                <h3>Choose Character</h3>
                <div className="character-grid">
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      className={`character-card ${selectedCharacter === character.id ? 'selected' : ''}`}
                      onClick={() => selectCharacter(character.id)}
                    >
                      <img src={character.sprite} alt={character.name} />
                      <div>
                        <strong>{character.name}</strong>
                        <p>{character.ability}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="lobby-panel">
                <h3>Map Vote</h3>
                <div className="map-grid">
                  {maps.map((map) => (
                    <button
                      key={map.id}
                      className={`map-card ${mapVotes[socketId] === map.id ? 'selected' : ''}`}
                      onClick={() => voteMap(map.id)}
                    >
                      <div className="map-preview" style={{ background: map.previewColor }}></div>
                      <div>
                        <strong>{map.name}</strong>
                        <p>{map.description}</p>
                        <span className="vote-count">Votes: {Object.values(mapVotes).filter((vote) => vote === map.id).length}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game playing state
  if (gameState === 'playing') {
    if (!imagesLoaded) {
      return (
        <div className="paintball-game">
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <h2>Loading Game...</h2>
            <p>Preparing the arena</p>
          </div>
        </div>
      );
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="paintball-game" tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
        <div className="game-header">
          <div className="header-info">
            <h2>Round {gameData?.round} / {gameData?.rounds_to_play}</h2>
            <p>Map: {gameData?.map?.name || 'Loading...'}</p>
            <div className="timer-display">
              <span className="timer-label">Time:</span>
              <span className="timer-value">{formatTime(gameData?.time_remaining || 0)}</span>
            </div>
          </div>
          <div className="header-controls">
            <div className="controls-list">
              <span><strong>WASD/Arrows:</strong> Move</span>
              <span><strong>Space/Right-Click:</strong> Shoot</span>
              <span><strong>Q:</strong> Ability</span>
              <span><strong>Mouse:</strong> Aim</span>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/game/paintball"><button className="logout-btn">Back to Lobby</button></Link>
          </div>
        </div>

      <div className="game-layout">
        <div className="scoreboard">
          <h3>Scoreboard</h3>
          {gameData?.players
            .sort((a, b) => b.eliminations - a.eliminations)
            .map((player) => (
            <div key={player.id} className="score-row">
              <div className="player-info">
                <span style={{ color: player.color }}>{player.name}</span>
                <span className="elim-count">{player.eliminations} elim</span>
              </div>
              {player.ability_active && (
                <span className="ability-indicator active">⚡ ABILITY ACTIVE</span>
              )}
              {player.ability_used && !player.ability_active && (
                <span className="ability-indicator used">✓ Used</span>
              )}
              {!player.ability_used && !player.ability_active && (
                <span className="ability-indicator ready">Q - Ready</span>
              )}
              <div className="player-health-bar">
                <div 
                  className="health-fill" 
                  style={{ 
                    width: `${(player.health / player.max_health) * 100}%`,
                    background: player.alive ? (player.health > 50 ? '#22c55e' : player.health > 25 ? '#fbbf24' : '#ef4444') : '#64748b'
                  }}
                ></div>
              </div>
            </div>
          ))}
          <div className="sidebar-chat">
            <h3>Team Chat</h3>
            <div className="chat-box">
              {chatMessages.map((msg, index) => (
                <div key={`${msg.timestamp}-${index}`} className="chat-message">
                  <strong>{msg.player}:</strong> {msg.message}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              />
              <button onClick={sendChat}>Send</button>
            </div>
          </div>
        </div>
        <div className="canvas-wrapper" onMouseMove={onMouseMove} onContextMenu={onRightClick} onWheel={onWheel}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="controls-hint">
        <span>Move: WASD / Arrow Keys</span>
        <span>Shoot: Space</span>
        <span>Aim: Mouse</span>
        <span>Ability: Q</span>
      </div>

      {roundTransition && (
        <div className="round-transition-overlay">
          <div className="transition-content">
            {roundTransition.type === 'start' && (
              <>
                <h1>Round {roundTransition.round}</h1>
                <p>Fight!</p>
              </>
            )}
            {roundTransition.type === 'end' && (
              <>
                <h1>Round {roundTransition.round} Complete!</h1>
                <p className="winner-text">{roundTransition.winner?.name || 'Draw'} wins!</p>
              </>
            )}
          </div>
        </div>
      )}

      {matchResult && (
        <div className="round-modal match-complete">
          <div className="modal-content">
            <h1>🎯 Match Complete!</h1>
            <div className="match-results">
              <h3>Final Leaderboard</h3>
              <div className="leaderboard">
                {gameData?.players
                  .map((player) => {
                    // Calculate total eliminations across all rounds
                    const totalElims = matchResult.reduce((sum, round) => {
                      const playerScore = round.scores?.find((s) => s.id === player.id);
                      return sum + (playerScore?.eliminations || 0);
                    }, 0);
                    return {
                      ...player,
                      totalElims,
                    };
                  })
                  .sort((a, b) => {
                    // Sort by rounds won first, then by total eliminations
                    if (b.rounds_won !== a.rounds_won) {
                      return b.rounds_won - a.rounds_won;
                    }
                    return b.totalElims - a.totalElims;
                  })
                  .map((player, idx) => (
                    <div key={player.id} className="leaderboard-row">
                      <span className="rank">
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                        {idx > 2 && `${idx + 1}.`}
                      </span>
                      <span className="player-name" style={{ color: player.color }}>
                        {player.name}
                      </span>
                      <span className="player-stats">
                        <strong>{player.rounds_won}</strong> round wins
                      </span>
                      <span className="player-stats">
                        <strong>{player.totalElims}</strong> total elims
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="match-buttons">
              <button className="paintball-btn" onClick={() => {
                setMatchResult(null);
                setGameState('lobby');
              }}>
                Back to Lobby
              </button>
              <Link to="/game/paintball">
                <button className="paintball-btn secondary">Leave Lobby</button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }

  // Fallback return
  return null;
}

export default Paintball;
