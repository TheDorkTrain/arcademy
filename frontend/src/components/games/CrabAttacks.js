import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

import '../Hub.css';

const LoveGame = ({ 
  gameFile = 'CrabAttacks.love', 
  version = '11.5',
  args = [],
  width = '800px',
  height = '600px',
  noCache = false 
}) => {
  const iframeRef = useRef(null);
  
   const buildGameUrl = () => {
    const params = new URLSearchParams();
    params.append('g', gameFile);
    
    if (version) {
      params.append('v', version);
    }
    
    if (args.length > 0) {
      params.append('arg', JSON.stringify(args));
    }
    
    if (noCache) {
      params.append('n', '1');
    }
    return `/lovejs/index.html?${params.toString()}`;
  };

  return (
    <div className="love-game-container" style={{
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      position: 'relative',
      paddingBottom: '75%', // 4:3 aspect ratio
      height: 0,
      overflow: 'hidden'
    }}>
      <iframe
        ref={iframeRef}
        src={buildGameUrl()}
        style={{
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '10px'
        }}
        title="LÖVE Game"
        allow="cross-origin-isolated"
      />
    </div>
  );
};

function CrabAttacks({ user, onLogout, token }) {

  return (
    <div className="hub-container">
      <div className="sidebar">
        <div>
        <h1> Every Night the Crab Attacks</h1>
        <h2> By Bryce</h2>
        <p>Made with the Löve2d framework</p>
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
       
     <div style={{
       minHeight: '100vh',
       height: '100vh',
       padding: '20px',
       overflow: 'auto',
       boxSizing: 'border-box'
     }}>
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Every Night the Crab Attacks
        </h1>
        
        <LoveGame 
          gameFile="CrabAttacks.love"
          version="11.5"
        />
        
        <div style={{
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#666',
            fontSize: '14px'
          }}>
            **Note for this embedded release the exit game button breaks it**
          </p>
        </div>
      </div>
    </div>

      
        
   
      </div>
    </div>
  );
}

export default CrabAttacks;

