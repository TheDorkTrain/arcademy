import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Tetris.css';
import '../../Hub.css';

// Tetris piece shapes
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

// Tetris piece colors
const COLORS = {
  I: '#8BCFE5',  // Bright turquoise/cyan
  O: '#FFB6C1',  // Soft pink
  T: '#FFC0CB',  // Light pink
  S: '#B0C4DE',  // Light steel blue
  Z: '#E6BE8A',  // Peach/sandy
  J: '#DDA0DD',  // Plum/lavender
  L: '#FFDE59'   // Soft yellow
};

const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000; // milliseconds

function Tetris({ user, onLogout, token }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [nextPiece, setNextPiece] = useState(null);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const canvasRef = useRef(null);
  const nextCanvasRef = useRef(null);
  const holdCanvasRef = useRef(null);
  const gameLoopRef = useRef(null);

  function createEmptyBoard() {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
  }

  function getRandomPiece() {
    const pieces = Object.keys(SHAPES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return randomPiece;
  }

  function rotatePiece(shape) {
    const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    return rotated;
  }

  function checkCollision(piece, position, testBoard = board) {
    const shape = SHAPES[piece];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          if (newY >= 0 && testBoard[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function mergePiece() {
    if (!currentPiece) return board;
    
    const newBoard = board.map(row => [...row]);
    const shape = SHAPES[currentPiece];
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardY = currentPosition.y + y;
          const boardX = currentPosition.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece;
          }
        }
      }
    }
    
    return newBoard;
  }

  function clearLines(testBoard) {
    let linesCleared = 0;
    const newBoard = testBoard.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    if (linesCleared > 0) {
      // Correct Tetris scoring: 1 line = 40, 2 lines = 100, 3 lines = 300, 4 lines (Tetris) = 1200
      const points = [0, 40, 100, 300, 1200][linesCleared] * level;
      setScore(prev => prev + points);
      setLines(prev => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          setSpeed(Math.max(100, INITIAL_SPEED - (newLevel - 1) * 100));
        }
        return newLines;
      });
    }
    
    return newBoard;
  }

  const spawnNewPiece = useCallback(() => {
    const piece = nextPiece || getRandomPiece();
    const newNext = getRandomPiece();
    const startX = Math.floor(BOARD_WIDTH / 2) - 1;
    const startY = 0;
    
    if (checkCollision(piece, { x: startX, y: startY })) {
      setGameOver(true);
      // Don't set gameStarted to false - keep showing the board
      return;
    }
    
    setCurrentPiece(piece);
    setCurrentPosition({ x: startX, y: startY });
    setNextPiece(newNext);
    setCanHold(true);
  }, [nextPiece, board]);

  const moveDown = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return false;
    
    const newPosition = { x: currentPosition.x, y: currentPosition.y + 1 };
    
    if (!checkCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
      return true;
    } else {
      const merged = mergePiece();
      const cleared = clearLines(merged);
      setBoard(cleared);
      spawnNewPiece();
      return false;
    }
  }, [currentPiece, currentPosition, isPaused, gameOver, board, spawnNewPiece]);

  const moveLeft = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const newPosition = { x: currentPosition.x - 1, y: currentPosition.y };
    if (!checkCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, isPaused, gameOver, board]);

  const moveRight = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    const newPosition = { x: currentPosition.x + 1, y: currentPosition.y };
    if (!checkCollision(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, isPaused, gameOver, board]);

  const rotate = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    
    const rotated = rotatePiece(SHAPES[currentPiece]);
    const oldShape = SHAPES[currentPiece];
    SHAPES[currentPiece] = rotated;
    
    if (checkCollision(currentPiece, currentPosition)) {
      SHAPES[currentPiece] = oldShape;
    } else {
      // Force re-render
      setCurrentPosition({ ...currentPosition });
    }
  }, [currentPiece, currentPosition, isPaused, gameOver, board]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    
    let dropDistance = 0;
    let newY = currentPosition.y;
    
    // Find the lowest position
    while (!checkCollision(currentPiece, { x: currentPosition.x, y: newY + 1 })) {
      newY++;
      dropDistance++;
    }
    
    // Award points for hard drop
    setScore(prev => prev + dropDistance * 2);
    
    // Update position to the lowest point
    setCurrentPosition({ x: currentPosition.x, y: newY });
    
    // Immediately merge and spawn new piece
    setTimeout(() => {
      // Need to manually merge using the new position
      const newBoard = board.map(row => [...row]);
      const shape = SHAPES[currentPiece];
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = newY + y;
            const boardX = currentPosition.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              newBoard[boardY][boardX] = currentPiece;
            }
          }
        }
      }
      
      const cleared = clearLines(newBoard);
      setBoard(cleared);
      spawnNewPiece();
    }, 50);
  }, [currentPiece, currentPosition, isPaused, gameOver, board, spawnNewPiece]);

  const holdCurrentPiece = useCallback(() => {
    if (!currentPiece || !canHold || isPaused || gameOver) return;
    
    if (holdPiece) {
      const temp = holdPiece;
      setHoldPiece(currentPiece);
      setCurrentPiece(temp);
      setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    } else {
      setHoldPiece(currentPiece);
      spawnNewPiece();
    }
    setCanHold(false);
  }, [currentPiece, holdPiece, canHold, isPaused, gameOver, spawnNewPiece]);

  // Keyboard controls
  const handleKeyDown = useCallback((e) => {
    if (!gameStarted || gameOver) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveRight();
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        rotate();
        break;
      case 'Enter':
        e.preventDefault();
        hardDrop();
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        holdCurrentPiece();
        break;
      case 'Escape':
        e.preventDefault();
        setIsPaused(prev => !prev);
        break;
      default:
        break;
    }
  }, [gameStarted, gameOver, moveLeft, moveRight, moveDown, rotate, hardDrop, holdCurrentPiece]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver && currentPiece) {
      gameLoopRef.current = setInterval(() => {
        moveDown();
      }, speed);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, isPaused, gameOver, currentPiece, speed, moveDown]);

  // Draw main board
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_WIDTH; i++) {
      ctx.beginPath();
      ctx.moveTo(i * BLOCK_SIZE, 0);
      ctx.lineTo(i * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * BLOCK_SIZE);
      ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, i * BLOCK_SIZE);
      ctx.stroke();
    }
    
    // Draw placed pieces
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillStyle = COLORS[cell];
          ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      });
    });
    
    // Draw current piece
    if (currentPiece && !gameOver) {
      const shape = SHAPES[currentPiece];
      ctx.fillStyle = COLORS[currentPiece];
      shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const drawX = (currentPosition.x + x) * BLOCK_SIZE;
            const drawY = (currentPosition.y + y) * BLOCK_SIZE;
            ctx.fillRect(drawX + 1, drawY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX + 1, drawY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        });
      });
    }
  }, [board, currentPiece, currentPosition, gameOver]);

  // Draw preview pieces
  function drawPreview(canvas, piece) {
    if (!canvas || !piece) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const shape = SHAPES[piece];
    const blockSize = 20;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (shape) {
      // Calculate dimensions of the piece
      const pieceWidth = shape[0].length * blockSize;
      const pieceHeight = shape.length * blockSize;
      
      // Center the piece in the canvas
      const offsetX = (canvas.width - pieceWidth) / 2;
      const offsetY = (canvas.height - pieceHeight) / 2;
      
      ctx.fillStyle = COLORS[piece];
      shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            ctx.fillRect(
              x * blockSize + offsetX, 
              y * blockSize + offsetY, 
              blockSize - 2, 
              blockSize - 2
            );
            // Add subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(
              x * blockSize + offsetX, 
              y * blockSize + offsetY, 
              blockSize - 2, 
              blockSize - 2
            );
          }
        });
      });
    }
  }

  useEffect(() => {
    if (nextCanvasRef.current) {
      drawPreview(nextCanvasRef.current, nextPiece);
    }
  }, [nextPiece]);

  useEffect(() => {
    if (holdCanvasRef.current) {
      drawPreview(holdCanvasRef.current, holdPiece);
    }
  }, [holdPiece]);

  // Start new game
  function startNewGame() {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLines(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsPaused(false);
    setHoldPiece(null);
    setCanHold(true);
    const firstPiece = getRandomPiece();
    const secondPiece = getRandomPiece();
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    setGameStarted(true);
  }

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
          <h1>🧱 Tetris</h1>
          <h2>Inspired by Janniebeth</h2>
          <p>Clear lines to score!</p>
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
        <div className="game-container">
          <div className="game-header">
            <h1>TETRIS</h1>
          </div>

          <div className="game-content tetris-content">
            {!gameStarted ? (
              <div className="tetris-start-screen">
                <h2>Welcome to Tetris!</h2>
                <button className="tetris-start-btn" onClick={startNewGame}>
                  Start Game
                </button>
                <div className="tetris-controls">
                  <h3>Controls:</h3>
                  <p>← → : Move Left/Right</p>
                  <p>↑ : Rotate</p>
                  <p>↓ : Soft Drop</p>
                  <p>Enter : Hard Drop</p>
                  <p>C : Hold Piece</p>
                  <p>Esc : Pause</p>
                </div>
              </div>
            ) : (
              <div className="tetris-game-area">
                <div className="tetris-left-panel">
                  <div className="tetris-panel tetris-hold-panel">
                    <h3>HOLD</h3>
                    <canvas 
                      ref={holdCanvasRef} 
                      width={130} 
                      height={100}
                      className="tetris-preview-canvas"
                    />
                  </div>
                  <div className="tetris-panel tetris-controls-panel">
                    <h3>CONTROLS</h3>
                    <div className="tetris-controls-list">
                      <p><strong>LEFT:</strong> Left</p>
                      <p><strong>RIGHT:</strong> Right</p>
                      <p><strong>DOWN:</strong> Down</p>
                      <p><strong>UP:</strong> Rotate</p>
                      <p><strong>RETURN:</strong> Drop</p>
                      <p><strong>C:</strong> Hold</p>
                      <p><strong>ESCAPE:</strong> Pause</p>
                    </div>
                  </div>
                </div>

                <div className="tetris-center">
                  <canvas
                    ref={canvasRef}
                    width={BOARD_WIDTH * BLOCK_SIZE}
                    height={BOARD_HEIGHT * BLOCK_SIZE}
                    className="tetris-canvas"
                  />
                  
                  {isPaused && (
                    <div className="tetris-overlay">
                      <div className="tetris-pause-menu">
                        <h2>PAUSED</h2>
                        <button onClick={() => setIsPaused(false)}>Resume</button>
                        <button onClick={() => {
                          setGameStarted(false);
                          setIsPaused(false);
                        }}>Main Menu</button>
                      </div>
                    </div>
                  )}

                  {gameOver && (
                    <div className="tetris-overlay">
                      <div className="tetris-game-over">
                        <h2>Game Over!</h2>
                        <div style={{ margin: '20px 0' }}>
                          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                            <strong>Final Score:</strong> {score.toLocaleString()}
                          </p>
                          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                            <strong>Level:</strong> {level}
                          </p>
                          <p style={{ fontSize: '16px' }}>
                            <strong>Lines Cleared:</strong> {lines}
                          </p>
                        </div>
                        
                        <div className="tetris-game-over-buttons">
                          <button onClick={startNewGame}>New Game</button>
                          <button onClick={() => {
                            setGameStarted(false);
                            setGameOver(false);
                          }}>Main Menu</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="tetris-right-panel">
                  <div className="tetris-panel tetris-next-panel">
                    <h3>NEXT</h3>
                    <canvas 
                      ref={nextCanvasRef} 
                      width={130} 
                      height={100}
                      className="tetris-preview-canvas"
                    />
                  </div>
                  
                  <div className="tetris-panel tetris-stats-panel">
                    <h3>SCORE</h3>
                    <p className="tetris-stat-value">{score.toLocaleString()}</p>
                    
                    <h3>LEVEL</h3>
                    <p className="tetris-stat-value">{level}</p>
                    
                    <h3>LINES</h3>
                    <p className="tetris-stat-value">{lines}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tetris;
