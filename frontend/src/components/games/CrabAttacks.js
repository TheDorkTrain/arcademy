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
    <div className="love-game-container">
      <iframe
        ref={iframeRef}
        src={buildGameUrl()}
        width={width}
        height={height}
        style={{
          border: 'none',
          display: 'block',
          margin: '0 auto'
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
       
     <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto" style={{backgroundColor: 'white'}}>
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Every Night the Crab Attacks
        </h1>
        
        <LoveGame 
          gameFile="CrabAttacks.love"
          version="11.5"
          width="800px"
          height="600px"
        />
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
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

