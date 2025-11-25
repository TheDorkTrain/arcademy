import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './RocketMans.css';

function RocketMans({ user, token }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const gameStateRef = useRef({
    rocket: { x: 100, y: 200, velocity: 0, rotation: 0 },
    obstacles: [],
    score: 0,
    frameCount: 0
  });

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const gameLoop = setInterval(() => {
        updateGame();
        drawGame(ctx, canvas);
      }, 1000 / 60);

      const handleKeyDown = (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp') {
          e.preventDefault();
          gameStateRef.current.rocket.velocity = -8;
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearInterval(gameLoop);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [gameStarted, gameOver]);

  const startGame = () => {
    gameStateRef.current = {
      rocket: { x: 100, y: 200, velocity: 0, rotation: 0 },
      obstacles: [],
      score: 0,
      frameCount: 0
    };
    setScore(0);
    setGameStarted(true);
    setGameOver(false);
  };

  const updateGame = () => {
    const state = gameStateRef.current;
    
    // Update rocket
    state.rocket.velocity += 0.5; // gravity
    state.rocket.y += state.rocket.velocity;
    state.rocket.rotation = Math.min(Math.max(state.rocket.velocity * 3, -30), 90);

    // Generate obstacles
    if (state.frameCount % 90 === 0) {
      const gap = 150;
      const minHeight = 50;
      const maxHeight = 300;
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      
      state.obstacles.push({
        x: 800,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        scored: false
      });
    }

    // Update obstacles
    state.obstacles = state.obstacles.filter(obs => {
      obs.x -= 3;
      
      // Check scoring
      if (!obs.scored && obs.x + 50 < state.rocket.x) {
        obs.scored = true;
        state.score += 10;
        setScore(state.score);
      }
      
      return obs.x > -50;
    });

    // Check collisions
    const rocketRadius = 20;
    if (state.rocket.y - rocketRadius < 0 || state.rocket.y + rocketRadius > 400) {
      endGame();
      return;
    }

    for (let obs of state.obstacles) {
      if (state.rocket.x + rocketRadius > obs.x && state.rocket.x - rocketRadius < obs.x + 50) {
        if (state.rocket.y - rocketRadius < obs.topHeight || 
            state.rocket.y + rocketRadius > obs.bottomY) {
          endGame();
          return;
        }
      }
    }

    state.frameCount++;
  };

  const drawGame = (ctx, canvas) => {
    const state = gameStateRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + state.frameCount) % canvas.width;
      const y = (i * 113) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw obstacles
    ctx.fillStyle = '#e74c3c';
    for (let obs of state.obstacles) {
      ctx.fillRect(obs.x, 0, 50, obs.topHeight);
      ctx.fillRect(obs.x, obs.bottomY, 50, canvas.height - obs.bottomY);
    }

    // Draw rocket
    ctx.save();
    ctx.translate(state.rocket.x, state.rocket.y);
    ctx.rotate((state.rocket.rotation * Math.PI) / 180);
    
    // Rocket body
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();
    
    // Rocket window
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(5, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Rocket flame
    if (state.rocket.velocity < 0) {
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(-15, -8);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-15, 8);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${state.score}`, 10, 30);
  };

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    
    if (gameStateRef.current.score > highScore) {
      setHighScore(gameStateRef.current.score);
    }

    if (user && token) {
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game_name: 'RocketMans',
            score: gameStateRef.current.score,
            score_metadata: `Score: ${gameStateRef.current.score}`
          })
        });
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    }
  };

  return (
    <div className="game-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Hub</button>
      
      <div className="game-header">
        <h1>🚀 RocketMans</h1>
      </div>

      <div className="game-content">
        <div className="rocket-game">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400}
            className="game-canvas"
          />
          
          {!gameStarted && !gameOver && (
            <div className="game-overlay">
              <h2>Press Start to Play</h2>
              <p>Press SPACE or ↑ to fly</p>
              <button onClick={startGame} className="start-btn">Start Game</button>
            </div>
          )}

          {gameOver && (
            <div className="game-overlay">
              <h2>Game Over!</h2>
              <p>Score: {score}</p>
              <p>High Score: {highScore}</p>
              <button onClick={startGame} className="start-btn">Play Again</button>
            </div>
          )}
        </div>

        <div className="game-instructions">
          <h3>How to Play:</h3>
          <ul>
            <li>Press SPACE or ↑ to make the rocket fly</li>
            <li>Avoid hitting the obstacles</li>
            <li>Try to get the highest score!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RocketMans;
