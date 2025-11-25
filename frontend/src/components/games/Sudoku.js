import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sudoku.css';

function Sudoku({ user, token }) {
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const canvasRef = useRef(null);

  useEffect(() => {
    generateNewGame(difficulty);
  }, []);

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    const matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gameWon) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameWon]);

  const generateSolvedBoard = () => {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    
    const isValid = (board, row, col, num) => {
      for (let i = 0; i < 9; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
      }
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[boxRow + i][boxCol + j] === num) return false;
        }
      }
      return true;
    };

    const solve = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (let num of numbers) {
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                if (solve(board)) return true;
                board[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    solve(board);
    return board;
  };

  const generateNewGame = (diff) => {
    const solvedBoard = generateSolvedBoard();
    const puzzleBoard = solvedBoard.map(row => [...row]);
    
    const cellsToRemove = diff === 'easy' ? 30 : diff === 'medium' ? 40 : 50;
    let removed = 0;
    
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (puzzleBoard[row][col] !== 0) {
        puzzleBoard[row][col] = 0;
        removed++;
      }
    }
    
    setBoard(puzzleBoard);
    setInitialBoard(puzzleBoard.map(row => [...row]));
    setGameWon(false);
    setTimeElapsed(0);
  };

  const handleCellClick = (row, col) => {
    if (initialBoard[row][col] === 0) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (num) => {
    if (selectedCell && initialBoard[selectedCell.row][selectedCell.col] === 0) {
      const newBoard = board.map(row => [...row]);
      newBoard[selectedCell.row][selectedCell.col] = num;
      setBoard(newBoard);
      checkWin(newBoard);
    }
  };

  const checkWin = (currentBoard) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentBoard[row][col] === 0) return;
        
        // Check row
        const rowNums = currentBoard[row];
        if (new Set(rowNums).size !== 9) return;
        
        // Check column
        const colNums = currentBoard.map(r => r[col]);
        if (new Set(colNums).size !== 9) return;
      }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxNums = [];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            boxNums.push(currentBoard[boxRow * 3 + i][boxCol * 3 + j]);
          }
        }
        if (new Set(boxNums).size !== 9) return;
      }
    }
    
    setGameWon(true);
    submitScore();
  };

  const submitScore = async () => {
    if (user && token) {
      const score = Math.max(1000 - timeElapsed * 10, 100);
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game_name: 'Sudoku',
            score: score,
            score_metadata: `Completed in ${timeElapsed} seconds`
          })
        });
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-container sudoku-matrix-container">
      <canvas ref={canvasRef} className="matrix-rain"></canvas>
      
      <div className="sudoku-content-wrapper">
        <button className="back-btn matrix-btn" onClick={() => navigate('/')}>← Back to Hub</button>
        
        <div className="game-header">
          <h1 className="matrix-title">⚡ MATRIX SUDOKU ⚡</h1>
        </div>

        <div className="game-content">
        <div className="sudoku-controls">
          <div className="game-info matrix-controls">
            <p className="matrix-text">⏱ TIME: {formatTime(timeElapsed)}</p>
            <select className="matrix-select" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); generateNewGame(e.target.value); }}>
              <option value="easy">EASY MODE</option>
              <option value="medium">MEDIUM MODE</option>
              <option value="hard">HARD MODE</option>
            </select>
            <button className="matrix-btn" onClick={() => generateNewGame(difficulty)}>⟳ NEW GAME</button>
          </div>
        </div>

        <div className="sudoku-board matrix-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="sudoku-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`sudoku-cell matrix-cell ${
                    initialBoard[rowIndex][colIndex] !== 0 ? 'fixed matrix-fixed' : 'matrix-editable'
                  } ${
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'selected matrix-selected' : ''
                  }`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell !== 0 ? <span className="matrix-digit">{cell}</span> : ''}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="number-pad matrix-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="matrix-num-btn" onClick={() => handleNumberInput(num)}>
              {num}
            </button>
          ))}
          <button className="matrix-num-btn matrix-clear" onClick={() => handleNumberInput(0)}>✕</button>
        </div>

        {gameWon && (
          <div className="win-message matrix-win">
            <div className="matrix-win-text">⚡ SYSTEM BREACH SUCCESSFUL ⚡</div>
            <div className="matrix-win-time">TIME: {formatTime(timeElapsed)}</div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default Sudoku;
