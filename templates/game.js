import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import '../Hub.css';
function Game({ user, onLogout, token }) {

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
        <h1> Game Title</h1>
        <h2> By Developer</h2>
        <p>Additional Info</p>
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
       
        {/* PUT MAIN GAME APP HERE */}

      
        
   
      </div>
    </div>
  );
}

export default Game;

