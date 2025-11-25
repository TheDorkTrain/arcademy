
# Arcademy Hub

A central hub for posting games and utils. 

## Features

- **Score Keeping** - Register to log scores on games that support it.
- **Entertainment for Hour** - Multiple short games to keep entertainment for at least an hour.

### Setup
1. Clone or download this repository
2. Navigate to the project directory:

3. (Optional) Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

1. Install Dependencies
```bash
npm run install
```

## How to Run

Run the hub by using:
```bash
npm run start
```

## How to Use (Player)
- Play Games in your local browser
- Register locally to record your scores
- Certain games require an OpenAPI Key set up in your .env file.

### Games
- Rocxs - A Clicker
- Matrix Soduku - Hit puzzle game with a techy visual
- Zork Mini - A text adventure in classic D&D style
- RocketMans- Flappybird ripoff
- Dungeon Crawler - small dungeon crawler with limited features
- Athlete Personality Quiz - Match your athlete type based on your answers
- Every Night the Crab Attacks - A short survival game where a crab attacks at night
- Would you Rather - A "this or that" question picker

## How to Use (Player)

1. **Start both servers** (backend and frontend)
2. **Open your browser** to `http://localhost:3000`
3. **Register an account** or continue as a guest
4. **Click on any game** to start playing
5. **Your scores will be saved** if you're logged in and displayed in the left sidebar

## How to Use (Adding a Game)

When adding a game or a utility there are a number of files you will have to touch
 - Add your react .js game file into the /frontend/src/components/games folder
   - It is reccommended that you use the wrapper located in the /templates/ folder 
 - If your project has a backend add a folder into to the /backend/
   - you will also need to add to the start command in the root package.json to add it to the start routine
 - Add any react dependencies to /frontend/package.json
 - Add any python dependencies to /backend/requirements.txt
 - Add routing for your app in the /frontend/src/App.js
 - Add a Hub Icon in the games array in /frontend/src/components/Hub.js
 - When the game is ready you can play it locally or request permission to push it as a release
 - When pushing to the collaborative github, you will be unable to push to main. Make a pullrequest from a branch named after the tool you wish to implement.

## Technologies Used

### Frontend
- React 18
- React Router for navigation
- CSS for styling
- Axios for API calls

### Backend
- Flask (Python web framework)
- SQLAlchemy (Database ORM)
- Flask-JWT-Extended (Authentication)
- bcrypt (Password hashing)
- SQLite (Database)
- Love2d Framework for Lua

## Project Structure

```
Arcademy/
├── backend/
│   ├── requirements.txt    # Python dependencies
│   ├── login               # Backend for login and scores
|   |
|   |                        -Backends for Games that require them-
│   └── would_you_rather_api         
│   └── crabAttacks      
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    |   |
    │   ├── components/
    │   ├── Hub.js           # Main game hub    
    │   │   └── games/
    |   |       |            - Game Files go here -
    │   │       ├── Sudoku.js
    │   │       ├── RocketMans.js
    │   │       ├── DungeonCrawler.js
    │   │       ├── PersonalityQuiz.js
    │   │       └── WouldYouRather.js
    │   ├── App.js          - Game Routing goes here-
    │   ├── App.css
    │   └── index.js
    └── package.json
```

## Login API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/user` - Get current user info
- `GET /api/scores` - Get user's scores
- `POST /api/scores` - Submit a new score

## Notes

- The database is created automatically on first run
- Scores are saved only for registered users
- Guest users can play all games but scores won't be saved
- The app uses JWT tokens for authentication

## Future Enhancements

- Leaderboards for each game
- Multiplayer support
- More games
- User profiles and avatars
- Social features (friends, challenges)

Enjoy playing! 🎮
