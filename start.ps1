# Arcademy Hub Startup Script
# This script checks prerequisites and starts the entire application

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "      Arcademy Hub - Startup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check Prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Test-Command node)) {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Recommended version: 18.x or higher" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = node --version
Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green

# Check npm
if (-not (Test-Command npm)) {
    Write-Host "[ERROR] npm is not installed!" -ForegroundColor Red
    exit 1
}
$npmVersion = npm --version
Write-Host "[OK] npm $npmVersion found" -ForegroundColor Green

# Check Python
if (-not (Test-Command python)) {
    Write-Host "[ERROR] Python is not installed!" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Red
    Write-Host "Recommended version: 3.8 or higher" -ForegroundColor Yellow
    exit 1
}
$pythonVersion = python --version
Write-Host "[OK] $pythonVersion found" -ForegroundColor Green

# Check pip
if (-not (Test-Command pip)) {
    Write-Host "[ERROR] pip is not installed!" -ForegroundColor Red
    Write-Host "Please reinstall Python with pip included" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] pip found" -ForegroundColor Green

Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".\backend\login\.env")) {
    Write-Host "[WARNING] .env file not found in backend/login/" -ForegroundColor Yellow
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" ".\backend\login\.env"
        Write-Host "[OK] .env file created. Please edit backend/login/.env and add your OpenAI API key if needed." -ForegroundColor Green
    } else {
        # Create a basic .env file
        $envContent = @"
# Arcademy Hub Environment Variables

# Optional: OpenAI API Key (required for AI-powered games like Zork)
OPENAI_API_KEY=your_openai_api_key_here

# Application secrets (default values work for development)
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production

# Database URL (SQLite is used by default)
DATABASE_URL=sqlite:///gamehub.db
"@
        $envContent | Out-File -FilePath ".\backend\login\.env" -Encoding UTF8
        Write-Host "[OK] .env file created with default values." -ForegroundColor Green
        Write-Host "    Edit backend/login/.env to add your OpenAI API key if needed." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Check if virtual environment exists
if (-not (Test-Path ".\venv")) {
    Write-Host "Python virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Virtual environment exists" -ForegroundColor Green
}

Write-Host ""

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path ".\node_modules") -or -not (Test-Path ".\frontend\node_modules")) {
    Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    npm run install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
    Write-Host "    (Run 'npm run install' if you need to update dependencies)" -ForegroundColor Gray
}

Write-Host ""

# Initialize database if it doesn't exist
if (-not (Test-Path ".\backend\login\instance\gamehub.db")) {
    Write-Host "Database not found. Initializing..." -ForegroundColor Yellow
    Write-Host "The database will be created automatically when the server starts." -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Starting Arcademy Hub..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The following services will start:" -ForegroundColor Yellow
Write-Host "  - Login/Score Backend    (Flask, port 5000)" -ForegroundColor Gray
Write-Host "  - Would You Rather API   (Flask)" -ForegroundColor Gray
Write-Host "  - Crab Attacks Server    (Flask)" -ForegroundColor Gray
Write-Host "  - React Frontend         (port 3000)" -ForegroundColor Gray
Write-Host ""
Write-Host "Once started, open your browser to: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm start
