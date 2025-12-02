# Getting Started with Arcademy Hub

Welcome to Arcademy Hub! This guide will help you get the project up and running in just a few minutes.

## 📋 What You Need

Before starting, make sure you have:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Check if installed: Open PowerShell and run `node --version`

2. **Python** (version 3.8 or higher)
   - Download from: https://www.python.org/
   - Check if installed: Open PowerShell and run `python --version`

3. **A web browser** (Chrome, Firefox, Edge, etc.)

## 🚀 Quickest Way to Start

### Option 1: PowerShell Script (Recommended)

1. Open PowerShell in the project directory
2. Run:
   ```powershell
   .\start.ps1
   ```
3. Wait for all services to start
4. Open http://localhost:3000 in your browser

**Note:** If you get a "script cannot be loaded" error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Option 2: Batch File

If PowerShell doesn't work, use the batch file:

1. Double-click `start.bat` in the project folder
2. Or open Command Prompt and run:
   ```cmd
   start.bat
   ```

### Option 3: Manual Start

If both scripts fail, you can start manually:

```powershell
# 1. Create virtual environment (first time only)
python -m venv venv

# 2. Install dependencies (first time only)
npm run install

# 3. Copy environment template (first time only)
copy .env.example backend\login\.env

# 4. Start everything
npm start
```

## 🎮 Using the Application

### First Time Setup

1. **Register an Account**
   - Click "Register" on the homepage
   - Choose a username and password
   - No email required for local use

2. **Explore Games**
   - Return to the hub (home icon)
   - Click on any game tile to play
   - Your scores will be saved automatically

3. **Optional: Enable AI Games**
   - Some games like "Zork" use OpenAI for dynamic content
   - Get an API key from: https://platform.openai.com/api-keys
   - Edit `backend/login/.env`
   - Replace `your_openai_api_key_here` with your actual key
   - Restart the servers (Ctrl+C then run start script again)

### Playing Games

- **Rocxs**: Click rapidly to increase your score
- **Matrix Sudoku**: Fill the grid with numbers 1-9
- **Zork Mini**: Type commands to explore (requires OpenAI key)
- **RocketMans**: Use spacebar or click to fly
- **Dungeon Crawler**: Use arrow keys to explore
- **Personality Quiz**: Answer questions to find your athlete type
- **Crab Attacks**: Survive the night against attacking crabs
- **Would You Rather**: Choose between two options

## ❓ Common Issues

### "Port already in use"

**Problem:** Another application is using port 3000 or 5000

**Solution:**
1. Close any other development servers
2. Or restart your computer to clear all ports

### "Cannot find module" or "Module not found"

**Problem:** Dependencies aren't installed properly

**Solution:**
```powershell
Remove-Item -Recurse -Force node_modules, frontend\node_modules
npm run install
```

### "python is not recognized"

**Problem:** Python isn't installed or not in PATH

**Solution:**
1. Download Python from https://www.python.org/
2. During installation, CHECK "Add Python to PATH"
3. Restart PowerShell/Command Prompt

### Database errors

**Problem:** Database file is corrupted

**Solution:**
```powershell
Remove-Item backend\login\instance\gamehub.db
```
Then restart the application - a new database will be created.

### Nothing happens when running scripts

**Problem:** PowerShell execution policy prevents scripts

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or use `start.bat` instead.

## 🛑 Stopping the Application

Press **Ctrl+C** in the PowerShell/Command Prompt window where the servers are running.

You may need to press it twice to stop all servers.

## 📊 What's Running?

When you start the application, these services run:

- **Frontend** (React) on http://localhost:3000
- **Login API** (Flask) on http://localhost:5000
- **Would You Rather API** (Flask) on http://localhost:5001
- **Crab Attacks Server** (Flask) on http://localhost:8000

All of these start automatically with one command!

## 💡 Tips

1. **Keep the terminal window open** while using the app
2. **Use Chrome DevTools** (F12) to see any errors if games don't work
3. **Check the terminal output** for backend errors
4. **Your data persists** between sessions (stored in SQLite database)
5. **Guest mode** lets you play without registering, but scores won't save

## 🤝 Need Help?

If you're still having trouble:

1. Check the **Troubleshooting** section in README.md
2. Make sure all prerequisites are installed correctly
3. Try the manual setup method
4. Check for error messages in the terminal
5. Open an issue on GitHub with details about your problem

## 🎉 You're Ready!

That's it! You should now be able to run Arcademy Hub and play all the games.

Have fun! 🎮
