import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import peopleData from './people.json';
import './GuessWho.css';

function GuessWho({ user, onLogout, token }) {
  const [gameState, setGameState] = useState("inactive");
  const [guess, setGuess] = useState("");
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [lastHint, setLastHint] = useState("");
  const [lastAnswer, setLastAnswer] = useState("");
  const [randomShuffle, setRandomShuffle] = useState([]);
  const [targetPerson, setTargetPerson] = useState(null);
  const [flippedCards, setFlippedCards] = useState([]);

  let hints = [
    {"question": "Is the person wearing glasses?", "target": "glasses", "option": ["yes", "no"]},
    {"question": "Does the person have facial hair?", "target": "facialHair", "option": ["yes", "no"]},
    {"question": "What is the length of the person's hair?", "target": "hairlength", "option": ["yes", "no"]},
    {"question": "What color is the person's hair?", "target": "hairColor", "option": ["black", "brown", "blonde", "red", "gray", "other"]},
    {"question": "Is the person smiling? (big smile)", "target": "smiling", "option": ["yes", "no"]},
    {"question": "What team is the person on?", "target": "team", "option": ["green", "red", "purple", "white", "blue"] },
    {"question": "What color shirt is the person wearing?", "target": "shirt", "option": ["black", "white"] },
    // {"question": "Is the person in Next Gen?", "target": "team", "option": ["yes", "no"] },
  ];

  function runHint(selectedHint) {
    setQuestionsAsked(questionsAsked + 1);
    setLastHint(selectedHint.question);
    setLastAnswer(targetPerson[selectedHint.target] ? `Answer: ${targetPerson[selectedHint.target]}` : "Answer: No");
  }

  function startGame() {
    setGameState("active");
    const shuffled = peopleData.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 12);
    setRandomShuffle(selected);
    setTargetPerson(selected[Math.floor(Math.random() * selected.length)]);
    setFlippedCards([]); 
    setQuestionsAsked(0);
    setLastHint("");
    setLastAnswer("");
    setGuess("");
  }

  function EndGame() {
    if (guess.toLowerCase() === targetPerson.name.toLowerCase()) {
      setGameState("won");
    } else {
      setGameState("gameOver");
    }
  }

  function toggleCard(index) {
    setFlippedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  }

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
          <h1>Guess Who</h1>
          <h2>By Bryce</h2>
          <p>Featuring Members involved in NextGen NWA. If you wish to be removed please let me know!</p>
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
        {gameState === "active" ? (
          <div className="guess-who-game">
            <div className="guess-who-cards">
              {randomShuffle.map((person, index) => {
                let imgSrc;
                try {
                  imgSrc = require(`./images/${person.name}.png`);
                } catch (err) {
                  try {
                    imgSrc = require(`./images/${person.name}.jpg`);
                  } catch (err2) {
                    imgSrc = null;
                  }
                }
                
                return (
                <div 
                  key={index} 
                  className={`guess-who-card ${flippedCards.includes(index) ? 'flipped' : ''}`}
                  onClick={() => toggleCard(index)}
                >
                  {imgSrc && (
                    <img 
                      src={imgSrc} 
                      alt={person.name} 
                      className="guess-who-image" 
                    />
                  )}
                  <p className="guess-who-name">{person.name}</p>
                </div>
                );
              })}
              
            </div>
            
            <div className="hints">
              <div className="questions">
              {hints.map((hint, index) => (
                <button key={index} onClick={() => runHint(hint)}>
                  {hint.question}
                </button>
              ))}
              </div>
              <div>
                <p>{lastHint}</p>
                <p>{lastAnswer}</p>
              </div>
              
              <div>
                <p>Questions Asked: {questionsAsked}</p>
                <input 
                  value={guess} 
                  onChange={(e) => setGuess(e.target.value)} 
                  type="text" 
                  placeholder="Who do you think it is?" 
                />
                <button onClick={EndGame}>Submit Guess</button>
              </div>
            </div>
          </div>
        ) : gameState === "won" ? (
          <div className="guess-who-end">
            <h2>Congratulations! You found {targetPerson.name}!</h2>
            <div>
              <button className="start-btn" onClick={startGame}>Play Again</button>
            </div>
          </div>
        ) : gameState === "gameOver" ? (
          <div className="guess-who-end">
            <h2>Game Over! The correct answer was {targetPerson.name}.</h2>
            <div>
              <button className="start-btn" onClick={startGame}>Try Again</button>
            </div>
          </div>
        ) : (
          <div className="guess-who-start">
            <button className="start-btn" onClick={startGame}>New Game</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuessWho;
