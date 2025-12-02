
# Arcademy Hub

A central hub for playing mini-games with score tracking. Play multiple short games, register to save your scores, and compete with yourself!

> **Quick Start for New Users:** Just run `.\start.ps1` (PowerShell) or `start.bat` (Command Prompt) and everything will be set up automatically! See the [Quick Start](#-quick-start-new-users) section below.

## Features

- **Score Keeping** - Register to log scores on games that support it
- **8 Different Games** - Multiple genres to keep you entertained
- **User Authentication** - Secure login and registration system
- **AI-Powered Games** - Some games use OpenAI for dynamic content

## Quick Start (New Users)

### Prerequisites

Before you begin, make sure you have these installed:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download here](https://www.python.org/)
3. **Git** (optional) - For cloning the repository

### Installation & Setup

1. **Clone or download this repository**
   ```powershell
   git clone <repository-url>
   cd arcademy
   ```

2. **Run the startup script**
   
   **PowerShell (Recommended):**
   ```powershell
   .\start.ps1
   ```
   
   **Command Prompt/Batch (Alternative):**
   ```cmd
   start.bat
   ```
   
   **Note:** If PowerShell gives an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   
   The startup script will automatically:
   - ✅ Check that Node.js and Python are installed
   - ✅ Create a Python virtual environment (if needed)
   - ✅ Install all dependencies (npm packages and Python packages)
   - ✅ Create a `.env` configuration file with defaults
   - ✅ Initialize the database
   - ✅ Start all backend and frontend servers

3. **Open your browser**
   
   Once all servers are running, navigate to:
   ```
   http://localhost:3000
   ```

4. **Optional: Configure OpenAI API Key**
   
   If you want to play AI-powered games (like Zork), add your OpenAI API key:
   - Open `backend/login/.env`
   - Replace `your_openai_api_key_here` with your actual API key
   - Get an API key at: https://platform.openai.com/api-keys
   - Restart the servers

That's it! You're ready to play! 

> **New to the project?** Check out [GETTING_STARTED.md](GETTING_STARTED.md) for a more detailed beginner-friendly guide with troubleshooting tips!

## How to Use (As a Player)

1. **Open the game hub** at `http://localhost:3000`
2. **Register an account** (or continue as a guest, but scores won't be saved)
3. **Click on any game** from the hub to start playing
4. **Your scores are automatically saved** when logged in
5. **View your scores** in the left sidebar

### Available Games

- **Rocxs** - A Clicker
- **Matrix Sudoku** - Hit puzzle game with a techy visual
- **Zork Mini** - A text adventure in classic D&D style(requires OpenAI API key)
- **RocketMans** - Flappybird ripoff
- **Dungeon Crawler** - small dungeon crawler with limited features
- **Athlete Personality Quiz** - Match your athlete type based on your answers
- **Every Night the Crab Attacks** - A short survival game where a crab attacks at night
- **Would You Rather** - A "this or that" question picker

## Manual Setup (Alternative Method)

If you prefer to set up manually or the automatic script doesn't work:

1. **Create virtual environment**
   ```powershell
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install dependencies**
   ```powershell
   npm run install
   ```
   This installs both backend (Python) and frontend (Node.js) dependencies.

3. **Configure environment variables**
   ```powershell
   copy .env.example backend\login\.env
   ```
   Edit `backend/login/.env` and add your OpenAI API key if needed.

4. **Start the application**
   ```powershell
   npm start
   ```
   This starts all servers concurrently (login API, game APIs, and React frontend).

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:
- Port 3000 (Frontend): Close any other React apps
- Port 5000 (Backend): Close any other Flask apps
- Use Task Manager to find and close the process using these ports

### Database Issues
If you encounter database errors:
```powershell
Remove-Item backend\login\instance\gamehub.db
```
The database will be recreated on next startup.

### Dependency Issues
If packages fail to install:
```powershell
# Clear and reinstall
Remove-Item -Recurse -Force node_modules, frontend\node_modules
npm run install
```

### Python Virtual Environment Issues
If the virtual environment has issues:
```powershell
Remove-Item -Recurse -Force venv
python -m venv venv
```
Then run `.\start.ps1` again.

## API Endpoints

### Authentication & Scores
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user  
- `GET /api/user` - Get current user info (requires JWT token)
- `GET /api/scores` - Get user's scores (requires JWT token)
- `POST /api/scores` - Submit a new score (requires JWT token)

### Game APIs
- Would You Rather API - Serves random questions
- Crab Attacks Server - Hosts the Lua-based game

## How to Add a New Game (For Developers)

When adding a game or utility, you'll need to modify several files:

1. **Add your game component**
   - Create a React component in `/frontend/src/components/games/`
   - Use the wrapper template in `/templates/` for consistency

2. **Add backend (if needed)**
   - Create a folder in `/backend/` for your game's API
   - Update the `start` command in root `package.json` to include your server

3. **Update dependencies**
   - Add React dependencies to `/frontend/package.json`
   - Add Python dependencies to `/backend/requirements.txt`

4. **Configure routing**
   - Add route in `/frontend/src/App.js`
   - Add game icon to the games array in `/frontend/src/components/Hub.js`

5. **Test locally and submit PR**
   - Test your game locally
   - Create a branch named after your game
   - Submit a pull request (cannot push directly to main)

## Technologies Used

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP requests
- **CSS** - Styling

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **Flask-JWT-Extended** - JWT authentication
- **Flask-CORS** - Cross-origin resource sharing
- **bcrypt** - Password hashing
- **SQLite** - Local database
- **OpenAI API** - AI-powered game content
- **Love2D** - Lua game framework (for Crab Attacks)

## Project Structure

```
arcademy/
├── start.ps1                   # Easy startup script (run this!)
├── .env.example                # Environment variable template
├── package.json                # Root dependencies & npm scripts
├── backend/
│   ├── requirements.txt        # Python dependencies
│   ├── login/
│   │   ├── app.py              # Authentication & score API
│   │   ├── .env                # Environment variables (create from .env.example)
│   │   └── instance/
│   │       └── gamehub.db      # SQLite database (auto-created)
│   ├── would_you_rather_api/   # Would You Rather game backend
│   └── crabAttacks/            # Crab Attacks game server
├── frontend/
│   ├── package.json            # Frontend dependencies
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js              # Main app component & routing
│       ├── components/
│       │   ├── Hub.js          # Game selection hub
│       │   ├── Login.js        # Login component
│       │   ├── Register.js     # Registration component
│       │   └── games/          # Individual game components
│       │       ├── Sudoku.js
│       │       ├── RocketMans.js
│       │       ├── DungeonCrawler.js
│       │       ├── PersonalityQuiz.js
│       │       ├── WouldYouRather.js
│       │       ├── CrabAttacks.js
│       │       ├── Zork.js
│       │       └── Rocxs.js
│       └── utils/
│           └── logger.js       # Logging utility
├── docs/                       # Documentation files
├── templates/                  # Game templates for developers
└── tests/                      # Test files
```

## Important Notes

- ✅ The database is created automatically on first run
- ✅ Scores are saved only for registered users
- ✅ Guest users can play all games but scores won't persist
- ✅ JWT tokens are used for secure authentication
- ⚠️ OpenAI API key is optional but required for Zork game
- ⚠️ Default secrets in `.env` are fine for local development but **must be changed in production**

## Future Enhancements

- [ ] Leaderboards for each game
- [ ] Multiplayer support
- [ ] Additional games
- [ ] User profiles and avatars
- [ ] Social features (friends, challenges)
- [ ] Game achievements and badges
- [ ] Mobile responsive design improvements

## License

See LICENSE file for details.

---

**Enjoy playing!** If you encounter any issues, check the Troubleshooting section above or open an issue on GitHub.
