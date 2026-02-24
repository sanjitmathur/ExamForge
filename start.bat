@echo off
echo ========================================
echo   ExamForge - AI Question Paper Generator
echo ========================================
echo.

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

:: Check for Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: Setup Python venv if needed
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

:: Activate venv and install deps
echo Installing backend dependencies...
call venv\Scripts\activate.bat
pip install -r backend\requirements.txt --quiet

:: Check for .env
if not exist "backend\.env" (
    echo WARNING: backend\.env not found. Copying from .env.example...
    copy backend\.env.example backend\.env
    echo Please edit backend\.env with your API keys!
    echo.
)

:: Install frontend deps if needed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Start backend
echo.
echo Starting backend on http://localhost:8000 ...
start "ExamForge Backend" cmd /k "call venv\Scripts\activate.bat && cd backend && python -m uvicorn app.main:app --reload --port 8000"

:: Start frontend
echo Starting frontend on http://localhost:5173 ...
start "ExamForge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ExamForge is starting up!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
pause
