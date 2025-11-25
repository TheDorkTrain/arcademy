import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DungeonCrawler.css';
import log from '../../utils/logger';

function DungeonCrawler({ user, token }) {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [player, setPlayer] = useState({ x: 1, y: 1, hp: 100, maxHp: 100, attack: 10, level: 1, exp: 0 });
  const [dungeon, setDungeon] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);

  const DUNGEON_SIZE = 15;

  useEffect(() => {
    if (gameStarted) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameStarted, player, enemies]);

  const getRandomFloorPosition = (dungeon) => {
    const floorPositions = [];
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        if (dungeon[y][x] === 'floor') {
          floorPositions.push({ x, y });
        }
      }
    }
    return floorPositions[Math.floor(Math.random() * floorPositions.length)] || { x: 1, y: 1 };
  };

  const getShuffledFloorPositions = (dungeon) => {
    const floorPositions = [];
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        if (dungeon[y][x] === 'floor') {
          floorPositions.push({ x, y });
        }
      }
    }
    // Shuffle positions
    for (let i = floorPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [floorPositions[i], floorPositions[j]] = [floorPositions[j], floorPositions[i]];
    }
    return floorPositions;
  };

  const startGame = () => {
    generateDungeon((newDungeon) => {
      const positions = getShuffledFloorPositions(newDungeon);
      // Player position
      const startPos = positions.shift();
      setPlayer({ x: startPos.x, y: startPos.y, hp: 100, maxHp: 100, attack: 10, level: 1, exp: 0 });
      // Enemies
      const newEnemies = [];
      for (let i = 0; i < 10 && positions.length; i++) {
        const pos = positions.shift();
        newEnemies.push({
          x: pos.x,
          y: pos.y,
          hp: 20 + i * 5,
          maxHp: 20 + i * 5,
          attack: 5 + i * 2,
          type: i % 3 === 0 ? 'goblin' : i % 3 === 1 ? 'skeleton' : 'orc'
        });
      }
      setEnemies(newEnemies);
      // Items
      const newItems = [];
      for (let i = 0; i < 5 && positions.length; i++) {
        const pos = positions.shift();
        newItems.push({
          x: pos.x,
          y: pos.y,
          type: i % 2 === 0 ? 'health' : 'weapon'
        });
      }
      setItems(newItems);
      setDungeon(newDungeon);
      setGameStarted(true);
      setScore(0);
      setMessage('Welcome to the dungeon! Use arrow keys to move.');
    });
  };

  const generateDungeon = (callback) => {
    const newDungeon = Array(DUNGEON_SIZE).fill(null).map(() => Array(DUNGEON_SIZE).fill('wall'));
    const roomCenters = [];
    // Create rooms
    for (let i = 0; i < 8; i++) {
      const roomWidth = Math.floor(Math.random() * 4) + 3;
      const roomHeight = Math.floor(Math.random() * 4) + 3;
      const roomX = Math.floor(Math.random() * (DUNGEON_SIZE - roomWidth - 2)) + 1;
      const roomY = Math.floor(Math.random() * (DUNGEON_SIZE - roomHeight - 2)) + 1;
      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          newDungeon[y][x] = 'floor';
        }
      }
      // Track room center
      roomCenters.push({
        x: Math.floor(roomX + roomWidth / 2),
        y: Math.floor(roomY + roomHeight / 2)
      });
    }
    // Connect rooms with corridors
    for (let i = 1; i < roomCenters.length; i++) {
      const prev = roomCenters[i - 1];
      const curr = roomCenters[i];
      // Horizontal corridor
      for (let x = Math.min(prev.x, curr.x); x <= Math.max(prev.x, curr.x); x++) {
        newDungeon[prev.y][x] = 'floor';
      }
      // Vertical corridor
      for (let y = Math.min(prev.y, curr.y); y <= Math.max(prev.y, curr.y); y++) {
        newDungeon[y][curr.x] = 'floor';
      }
    }
    if (callback) callback(newDungeon);
  };

  const handleKeyPress = (e) => {
    log.info(`Key pressed: ${e.key}`);
    if (!gameStarted || player.hp <= 0) return;
    
    let newX = player.x;
    let newY = player.y;
    
    switch(e.key) {
      case 'ArrowUp':
        newY--;
        break;
      case 'ArrowDown':
        newY++;
        break;
      case 'ArrowLeft':
        newX--;
        break;
      case 'ArrowRight':
        newX++;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    
    if (newX >= 0 && newX < DUNGEON_SIZE && newY >= 0 && newY < DUNGEON_SIZE) {
      if (dungeon[newY][newX] === 'floor') {
        // Check for enemy
        const enemyIndex = enemies.findIndex(e => e.x === newX && e.y === newY);
        if (enemyIndex !== -1) {
          combat(enemyIndex, newX, newY);
        } else {
          // Check for item
          const itemIndex = items.findIndex(i => i.x === newX && i.y === newY);
          if (itemIndex !== -1) {
            collectItem(itemIndex);
          }
          setPlayer(prev => ({ ...prev, x: newX, y: newY }));
        }
      }
    }
  };

  const nextDungeon = (currentLevel, currentPlayer) => {
    generateDungeon((newDungeon) => {
      const positions = getShuffledFloorPositions(newDungeon);
      // Player keeps position if possible, else gets new valid position
      let startPos = positions.shift();
      setPlayer({
        x: startPos.x,
        y: startPos.y,
        hp: currentPlayer.hp,
        maxHp: currentPlayer.maxHp,
        attack: currentPlayer.attack,
        level: currentPlayer.level,
        exp: currentPlayer.exp
      });
      // Harder enemies
      const newEnemies = [];
      for (let i = 0; i < 10 && positions.length; i++) {
        const pos = positions.shift();
        newEnemies.push({
          x: pos.x,
          y: pos.y,
          hp: 30 + i * 10 + currentLevel * 10,
          maxHp: 30 + i * 10 + currentLevel * 10,
          attack: 10 + i * 3 + currentLevel * 2,
          type: i % 3 === 0 ? 'goblin' : i % 3 === 1 ? 'skeleton' : 'orc'
        });
      }
      setEnemies(newEnemies);
      // New items
      const newItems = [];
      for (let i = 0; i < 5 && positions.length; i++) {
        const pos = positions.shift();
        newItems.push({
          x: pos.x,
          y: pos.y,
          type: i % 2 === 0 ? 'health' : 'weapon'
        });
      }
      setItems(newItems);
      setDungeon(newDungeon);
      setMessage(`New dungeon! Enemies are stronger. Level: ${currentLevel}`);
    });
  };

  const combat = (enemyIndex, newX, newY) => {
    const enemy = enemies[enemyIndex];
    const playerDamage = player.attack;
    const enemyDamage = enemy.attack;
    enemy.hp -= playerDamage;
    if (enemy.hp <= 0) {
      setMessage(`You defeated the ${enemy.type}! +${enemy.maxHp} exp`);
      const newEnemies = [...enemies];
      newEnemies.splice(enemyIndex, 1);
      setEnemies(newEnemies);
      const newExp = player.exp + enemy.maxHp;
      const newScore = score + enemy.maxHp;
      setScore(newScore);
      let newPlayer = { ...player, x: newX, y: newY, exp: newExp };
      if (newExp >= 100 * player.level) {
        newPlayer.level++;
        newPlayer.maxHp += 20;
        newPlayer.hp = newPlayer.maxHp;
        newPlayer.attack += 5;
        setMessage(`Level Up! You are now level ${newPlayer.level}!`);
      }
      setPlayer(newPlayer);
      if (newEnemies.length === 0) {
        // Instead of ending game, generate next dungeon
        nextDungeon(newPlayer.level, newPlayer);
        return;
      }
    } else {
      const newPlayer = { ...player, hp: Math.max(0, player.hp - enemyDamage) };
      setPlayer(newPlayer);
      setMessage(`You hit the ${enemy.type} for ${playerDamage} damage. It hits you back for ${enemyDamage}!`);
      if (newPlayer.hp <= 0) {
        setMessage('You have been defeated! Game Over.');
        endGame(score);
      }
    }
  }; // close combat function

  const collectItem = (itemIndex) => {
    const item = items[itemIndex];
    const newItems = [...items];
    newItems.splice(itemIndex, 1);
    setItems(newItems);
    
    if (item.type === 'health') {
      setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 30) }));
      setMessage('You found a health potion! +30 HP');
    } else {
      setPlayer(prev => ({ ...prev, attack: prev.attack + 5 }));
      setMessage('You found a weapon! +5 Attack');
    }
  };

  const endGame = async (finalScore) => {
    if (user && token) {
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game_name: 'Dungeon Crawler',
            score: finalScore,
            score_metadata: `Level ${player.level}, Score: ${finalScore}`
          })
        });
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    }
  };

  const getCellContent = (x, y) => {
    if (x === player.x && y === player.y) {
      return '🧙';
    }
    const enemy = enemies.find(e => e.x === x && e.y === y);
    if (enemy) {
      if (enemy.type === 'goblin') return '👺';
      if (enemy.type === 'skeleton') return '💀';
      return '👹';
    }
    const item = items.find(i => i.x === x && i.y === y);
    if (item) {
      return item.type === 'health' ? '❤️' : '⚔️';
    }
    return '';
  };

  return (
    <div className="dungeon-crawler">
      <div className="info">
        <div>HP: {player.hp}/{player.maxHp}</div>
        <div>Attack: {player.attack}</div>
        <div>Level: {player.level}</div>
        <div>Score: {score}</div>
      </div>
      <div className="message">{message}</div>
      <div className="dungeon">
        {dungeon.map((row, y) => (
          <div key={y} className="dungeon-row">
            {row.map((cell, x) => {
              let cellType = cell === 'floor' ? 'floor' : 'wall';
              return (
                <div key={x} className={`dungeon-cell ${cellType}`}>
                  {getCellContent(x, y)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="controls">
        <button onClick={startGame} disabled={gameStarted}>Start Game</button>
        <button onClick={() => navigate('/')} >Leave Dungeon</button>
      </div>
    </div>
  );
}

export default DungeonCrawler;
