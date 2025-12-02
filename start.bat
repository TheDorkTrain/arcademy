@echo off
REM Arcademy Hub Startup Script (Batch version)
REM Use this if you have issues running the PowerShell script

echo ================================================
echo       Arcademy Hub - Startup Script
echo ================================================
echo.

echo Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found

REM Check npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm found

REM Check Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    echo Recommended version: 3.8 or higher
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [OK] %PYTHON_VERSION% found

REM Check pip
where pip >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pip is not installed!
    echo Please reinstall Python with pip included
    pause
    exit /b 1
)
echo [OK] pip found

echo.

REM Check if .env file exists
if not exist "backend\login\.env" (
    echo [WARNING] .env file not found in backend/login/
    echo Creating .env file from template...
    
    if exist ".env.example" (
        copy ".env.example" "backend\login\.env" >nul
        echo [OK] .env file created. Please edit backend/login/.env and add your OpenAI API key if needed.
    ) else (
        REM Create a basic .env file
        (
            echo # Arcademy Hub Environment Variables
            echo.
            echo # Optional: OpenAI API Key ^(required for AI-powered games like Zork^)
            echo OPENAI_API_KEY=your_openai_api_key_here
            echo.
            echo # Application secrets ^(default values work for development^)
            echo SECRET_KEY=dev-secret-key-change-in-production
            echo JWT_SECRET_KEY=dev-jwt-secret-change-in-production
            echo.
            echo # Database URL ^(SQLite is used by default^)
            echo DATABASE_URL=sqlite:///gamehub.db
        ) > "backend\login\.env"
        echo [OK] .env file created with default values.
        echo     Edit backend/login/.env to add your OpenAI API key if needed.
    )
    echo.
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Python virtual environment not found. Creating one...
    python -m venv venv
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Virtual environment created
    ) else (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
) else (
    echo [OK] Virtual environment exists
)

echo.

REM Check if dependencies are installed
echo Checking dependencies...

if not exist "node_modules" (
    echo Installing dependencies ^(this may take a few minutes^)...
    call npm run install
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Dependencies installed successfully
    ) else (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed
    echo     ^(Run 'npm run install' if you need to update dependencies^)
)

echo.
echo ================================================
echo Starting Arcademy Hub...
echo ================================================
echo.
echo The following services will start:
echo   - Login/Score Backend    ^(Flask, port 5000^)
echo   - Would You Rather API   ^(Flask^)
echo   - Crab Attacks Server    ^(Flask^)
echo   - React Frontend         ^(port 3000^)
echo.
echo Once started, open your browser to: http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start the application
npm start
