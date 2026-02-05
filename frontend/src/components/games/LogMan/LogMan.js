import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import '../../Hub.css';
import gamephoto from './gamephoto.png';
import logmanZip from './logman.zip';

function Game({ user, onLogout, token }) {

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
        <h1> LogMan</h1>
        <h2> By Bryce McWhirter</h2>
        <p>Written for our mainframe test environment</p>
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
       
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', backgroundColor: 'black' }}>
       <img src={gamephoto} alt="LogMan Game Screenshot" className="game-screenshot" style={{width: '75%'}} />

       <p> Logman is a variation of the classic game Hangman coded with Metal C</p>
       <p> The whole game is playable within the System Log of NextGen's mainframe environment. </p>
       <p> The host does need to compile the file and run it each time the game progresses</p>

       <a href={logmanZip} download="logman.zip">
         <button className="logout-btn" style={{ marginTop: '20px' }}>Download LogMan.zip</button>
       </a>

        </div>
      
        
   
      </div>
    </div>
  );
}

export default Game;

