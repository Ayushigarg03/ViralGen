@echo off
echo ===================================================
echo   Starting ViralGen AI Suite (Local Fallback Mode)
echo ===================================================
echo.

:: 1. Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.11+.
    pause
    exit /b
)

:: 2. Check Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js.
    pause
    exit /b
)

:: 3. Setup Backend Environment
echo [STEP 1/4] Installing Python Backend dependencies...
pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Failed installing dependencies. Proceeding anyway...
)

:: 4. Start FastAPI server in a new window
echo [STEP 2/4] Starting FastAPI backend on port 8000...
set DATABASE_URL=sqlite:///./viralgen.db

:: [OPTIONAL] Paste your Google Apps Script Web App URL below to sync with a live Google Sheet
set GOOGLE_SHEET_WEBHOOK_URL=

start "ViralGen API Server" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

:: 5. Install React dependencies
echo [STEP 3/4] Installing React Frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed in frontend directory.
    pause
    exit /b
)

:: 6. Start React Web Server
echo [STEP 4/4] Starting Vite React server on port 3000...
echo.
echo ===================================================
echo   Server started!
echo   - Backend API: http://localhost:8000
echo   - Frontend Client: http://localhost:3000
echo ===================================================
echo.
start http://localhost:3000
npm run dev

pause
