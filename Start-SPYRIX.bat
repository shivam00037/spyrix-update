@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo          SPYRIX INVOICE
echo       React + MongoDB Starter
echo ========================================

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 20+ and run this file again.
  pause
  exit /b 1
)

if not exist "server\.env" (
  copy "server\.env.example" "server\.env" >nul
  echo Created server\.env. Make sure MONGODB_URI points to your MongoDB database.
)

if not exist "node_modules\.bin\concurrently.cmd" call npm install
if errorlevel 1 goto :failed
if not exist "client\node_modules\.bin\vite.cmd" call npm install --prefix client
if errorlevel 1 goto :failed
if not exist "server\node_modules\.bin\nodemon.cmd" call npm install --prefix server
if errorlevel 1 goto :failed

call npm run dev
goto :end

:failed
echo Dependency installation failed. Check your internet connection and npm output.
pause
:end
endlocal
