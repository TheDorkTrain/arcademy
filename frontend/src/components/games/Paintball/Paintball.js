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
    setGameState('lobby');
    navigate(`/game/paintball/${data.room_code}`);
  }, [navigate]);

  const handleRoomJoined = useCallback((data) => {
    setRoomCode(data.room_code);
    setRoomName(data.room_name || data.room_code);
    setPlayers(data.players || []);
  setMaps(mergeMaps(data.maps));
  setCharacters(mergeCharacters(data.characters));
    setRoundsToPlay(data.rounds_to_play || 3);
    setGameState('lobby');
    navigate(`/game/paintball/${data.room_code}`);
  }, [navigate]);

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
    setGameState('playing');
  }, []);

  const handleGameUpdate = useCallback((data) => {
    setGameData(data);
  }, []);

  const handleRoundEnded = useCallback((data) => {
    setRoundResult(data);
  }, []);

  const handleRoundStarted = useCallback((data) => {
    setGameData(data);
    setRoundResult(null);
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
    setRoomCode(roomId.toUpperCase());
    setGameState('menu');
  }, [roomId]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData?.map) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = gameData.map;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#12263a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#2f4c6b';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    gameData.players.forEach((player) => {
      const character = CHARACTER_CARDS.find((char) => char.id === player.character);
      ctx.fillStyle = character?.color || '#f97316';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
      ctx.fill();

  const labelText = player.name;
  ctx.font = '12px sans-serif';
  const textWidth = ctx.measureText(labelText).width;
  const labelX = player.x - textWidth / 2;
  const labelY = player.y - 28;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(labelX - 6, labelY - 12, textWidth + 12, 16);
  ctx.fillStyle = '#fff';
  ctx.fillText(labelText, labelX, labelY);

      ctx.strokeStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(player.aim) * 26, player.y + Math.sin(player.aim) * 26);
      ctx.stroke();
    });
  }, [gameData]);

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
      socket.emit('shoot', { aim: aimRef.current });
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
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const me = gameData.players.find((p) => p.id === socket.id);
    if (!me) return;
    const dx = x - me.x;
    const dy = y - me.y;
    aimRef.current = Math.atan2(dy, dx);
  };

  if (gameState === 'menu') {
    return (
      <div className="hub-container">
        <div className="sidebar">
          <div>
            <h1>🎯 Paintball</h1>
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
                      <span>{player.name}</span>
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

  return (
    <div className="paintball-game" tabIndex={0} onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
      <div className="game-header">
        <div>
          <h2>Round {gameData?.round} / {gameData?.rounds_to_play}</h2>
          <p>Map: {gameData?.map?.name || 'Loading...'}</p>
        </div>
        <div>
          <Link to="/game/paintball"><button className="logout-btn">Back to Lobby</button></Link>
        </div>
      </div>

      <div className="game-layout">
        <div className="scoreboard">
          <h3>Scoreboard</h3>
          {gameData?.players.map((player) => (
            <div key={player.id} className="score-row">
              <span>{player.name}</span>
              <span>{player.eliminations} elim</span>
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
        <div className="canvas-wrapper" onMouseMove={onMouseMove}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="controls-hint">
        <span>Move: WASD / Arrow Keys</span>
        <span>Shoot: Space</span>
        <span>Aim: Mouse</span>
      </div>

      {roundResult && (
        <div className="round-modal">
          <div className="modal-content">
            <h2>Round {roundResult.round} Complete</h2>
            <p>Winner: {roundResult.winner?.name || 'No winner'}</p>
          </div>
        </div>
      )}

      {matchResult && (
        <div className="round-modal">
          <div className="modal-content">
            <h2>Match Complete</h2>
            <ul>
              {matchResult.map((round) => (
                <li key={round.round}>
                  Round {round.round}: {round.winner?.name || 'No winner'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Paintball;
