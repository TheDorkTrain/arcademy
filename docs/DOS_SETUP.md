# DOS Multiplayer - Setup & Troubleshooting Guide

## Overview
The DOS multiplayer game is a full-featured 8-player online card game built with Flask-SocketIO backend and React frontend.

## Files Created
- **Backend:**
  - `backend/dos/dos_game.py` - Complete DOS game logic (400+ lines)
  - `backend/dos/dos_server.py` - Flask-SocketIO multiplayer server (280+ lines)

- **Frontend:**
  - `frontend/src/components/games/Dos/Dos.js` - React component (550+ lines)
  - `frontend/src/components/games/Dos/Dos.css` - Styling with 8-player layout (550+ lines)

## Features Implemented
✅ Full DOS game rules (108-card deck, special cards, etc.)
✅ Room-based multiplayer (4-character room codes)
✅ 8-player support with circular layout
✅ Real-time game synchronization via WebSocket
✅ Interactive modals (color picker, draw confirmation, winner screen)
✅ DOS call and challenge system
✅ Card stacking (+2 on +2, +4 on +4)
✅ Turn indicators and game state display
✅ Two-box menu layout (Name entry + Lobby creation/joining)

## Starting the Server

### Method 1: Using start.bat (Recommended)
```cmd
start.bat
```
This starts all backend services including the DOS server on port 5004.

### Method 2: Manual Start
```cmd
cd backend/dos
python dos_server.py
```

The server will start on:
- Local: http://127.0.0.1:5004
- Network: http://10.25.160.29:5004 (accessible by others on your network)

## Connection Status

### How to Check if Server is Running
1. Look for this output in the terminal:
   ```
   * Running on http://127.0.0.1:5004
   * Running on http://10.25.160.29:5004
   ```

2. In the DOS game menu, check the status indicator at the top:
   - ✅ **No red warning** = Connected
   - ⚠️ **"Not connected to server"** = Disconnected

### Common Issues

**Issue: "Not connected to server" appears**
- **Cause:** DOS server not running or frontend started before backend
- **Solution:** 
  1. Stop all servers (Ctrl+C)
  2. Run `start.bat` again
  3. Wait for all servers to start (look for "Compiled successfully!" in frontend)
  4. Refresh browser or navigate to http://localhost:3000/game/dos

**Issue: Port 5004 already in use**
- **Cause:** DOS server already running from previous session
- **Solution:**
  1. Find process: `netstat -ano | findstr :5004`
  2. Kill process: `taskkill /PID <process_id> /F`
  3. Restart with `start.bat`

**Issue: Server starts but disconnects immediately**
- **Cause:** CORS or firewall blocking
- **Solution:** Already configured with `cors_allowed_origins="*"` in dos_server.py

## Menu UI Layout

### Two-Box Design
The menu has been redesigned with side-by-side boxes:

**Box 1 - Player Name:**
- Name input field (12 characters max)
- "Save Name" button with purple gradient
- Shows notification when name is saved

**Box 2 - Lobbies:**
- **Create Lobby:** Optional lobby name + "Create Room" button
- **Join Lobby:** Room code input (4 characters) + "Join Room" button

Both boxes are disabled until the server connection is established.

## Game Flow

1. **Menu State:** Enter name, create/join room
2. **Lobby State:** Wait for players (2-8), host starts game
3. **Playing State:** Play cards, draw, call DOS, win!

## WebSocket Events
The game uses these socket events:
- `create_room` - Host creates new game
- `join_room` - Players join with code
- `start_game` - Host starts the game
- `play_card` - Player plays a card
- `draw_card` - Player draws from deck
- `call_dos` - Player calls DOS
- `challenge_dos` - Challenge a player who didn't call DOS

## Testing the Connection

### Quick Test:
1. Start servers with `start.bat`
2. Open browser to http://localhost:3000/game/dos
3. Check for red "Not connected" warning
4. If connected, you should see:
   - No warning message
   - "Create Room" and "Join Room" buttons enabled
   - Name input field active

### Test Multiplayer:
1. Create a room (get 4-character code)
2. Open another browser window (incognito)
3. Join with the room code
4. You should see both players in the lobby

## Dependencies
Already installed in `backend/requirements.txt`:
- flask-socketio==5.3.5
- python-socketio==5.10.0
- eventlet==0.33.3

Frontend dependency installed:
- socket.io-client (in frontend/node_modules)

## Network Play
To play with others on your local network:
1. Start the server (it binds to 0.0.0.0)
2. Share your network IP (shown in terminal, e.g., 10.25.160.29)
3. Other players connect to: http://YOUR_IP:3000/game/dos

## Debugging Tips

### Check Server Logs:
The terminal running dos_server.py shows all connections:
```
Client connected: <socket_id>
Room created: ABCD
Player joined: PlayerName
```

### Check Browser Console:
Open DevTools (F12) and look for:
```
Connected to Dos server
```

### Common Error Messages:
- "Please enter your name" - Name field is empty
- "Please enter a room code" - Joining without code
- "Not your turn!" - Playing out of turn
- "Room not found" - Invalid room code

## Future Enhancements
Potential features to add:
- [ ] Persistent lobby list
- [ ] Chat system
- [ ] Player statistics/leaderboard
- [ ] Custom game rules (house rules)
- [ ] Reconnection support
- [ ] Spectator mode

## Support
If issues persist:
1. Check all servers are running in start.bat output
2. Verify Python dependencies: `pip install -r backend/requirements.txt`
3. Verify frontend dependencies: `cd frontend && npm install`
4. Clear browser cache and refresh
