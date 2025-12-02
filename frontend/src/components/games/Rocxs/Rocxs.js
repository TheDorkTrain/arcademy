import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Rocxs.css';
import rocxsImg1 from '../Images/rocx1.png';
import rocxsImg2 from '../Images/roxs2.png';
import '../../Hub.css';

function Rocxs({ user, onLogout, token }) {
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
  <div className="hub-container">
      {/* {showAd && (
        <div className="hub-ad-modal">
          <img src={adImg} alt="Ad" className="hub-ad-image" />
          <button className="hub-ad-close" onClick={handleCloseAd}>X</button>
        </div>
      )} */}
      <div className="sidebar">
         <div>
        <h1> Rocxs</h1>
        <h2> By Christy and Bryce</h2>
        <p>Shoutout to Frederick who playtested</p>
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

     </div>
    </div>
  );
}


export default Rocxs;