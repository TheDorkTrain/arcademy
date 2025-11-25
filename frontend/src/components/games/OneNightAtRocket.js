
import React, { useState } from 'react';
import './OneNightAtRocket.css';
import backround from "./Images/Designer.gif"
import scare from "./Images/Scare.png"
// Example images (replace with your own)
const images = [
  backround,
  scare
];

function OneNightAtRocket({ user, token }) {


  const [step, setStep] = useState(0); // 0: first image, 1: second image
  const [won, setWon] = useState(false);

  const handleClockIn = () => {
    setStep(1);
  };

  const handleClockOut = () => {
    setWon(true);
  };

  const handleReplay = () => {
    setStep(0);
    setWon(false);
  };

  return (
    <div className="one-night-at-rocket">
      <h2 className="spooky-title">One Night At Rocket</h2>
      {step === 0 && !won && (
        <>
          <div className="game-image-wrapper">
            <img
              src={images[0]}
              alt="Rocket HQ scene"
              className="game-image"
            />
          </div>
          <div className="game-btn-group">
            <button onClick={handleClockIn} className="game-btn">Clock In</button>
            <button onClick={handleClockOut} className="game-btn">Clock Out</button>
          </div>
        </>
      )}
      {step === 1 && !won && (
        <>
          <div className="game-image-wrapper">
            <img
              src={images[1]}
              alt="Rocket HQ scene"
              className="game-image"
            />
          </div>
          <div className="game-btn-group">
            <button onClick={handleReplay} className="game-btn">Retry</button>
          </div>
        </>
      )}
      {won && (
        <div className="win-message">
          <h3>Success! You win!</h3>
          <button onClick={handleReplay} className="game-btn">Replay</button>
        </div>
      )}
    </div>
  );
}

export default OneNightAtRocket;
