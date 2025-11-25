import React, { useState } from 'react';
import './Rocxs.css';
import rocxsImg1 from './Images/rocx1.png';
import rocxsImg2 from './Images/roxs2.png';

function Rocxs({ user, token }) {
  const [showFirst, setShowFirst] = useState(true);
  const [rocxScore, setRocxScore] = useState(0);

  const handleImageClick = () => {
    setRocxScore(rocxScore + 1);
    setShowFirst(!showFirst);
  };

  const handleSubmitScore = async () => {
    if (user && token && rocxScore > 0) {
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            game_name: 'ROCXS',
            score: rocxScore,
            score_metadata: `Score: ${rocxScore}`
          })
        });
        setRocxScore(0);
      } catch (err) {
        console.error('Failed to submit score:', err);
        alert('Failed to submit score. Please try again.');
      }}
  };

  return (
    <div className="rocxs-game">
      <h2 className="rocxs-title">ROCXS</h2>
      <h3 className="rocxs-title">Score: {rocxScore}</h3>
      <div className="rocxs-gif-wrapper">
        <img
          src={showFirst ? rocxsImg1 : rocxsImg2}
          alt="ROCXS"
          className="rocxs-gif"
          onClick={handleImageClick}
        />
      </div>
      {user && ( <button className="submit-score-btn" onClick={handleSubmitScore}>
        Submit Score
      </button>)}
    </div>
  );
}


export default Rocxs;