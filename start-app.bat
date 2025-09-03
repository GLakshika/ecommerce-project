@echo off
echo Starting BrightBuy E-commerce Application...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "npm run dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Press any key to close this window...
pause > nul
