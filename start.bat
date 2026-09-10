@echo off
setlocal EnableExtensions

rem Start the backend and frontend development servers.
pushd "%~dp0"

if not exist "backend\.env" (
  echo ERROR: backend\.env was not found. Run setup.bat first.
  pause
  goto :fail
)
if not exist "frontend\.env" (
  echo ERROR: frontend\.env was not found. Run setup.bat first.
  pause
  goto :fail
)
if not exist "backend\node_modules" (
  echo ERROR: Backend dependencies were not found. Run setup.bat first.
  pause
  goto :fail
)
if not exist "frontend\node_modules" (
  echo ERROR: Frontend dependencies were not found. Run setup.bat first.
  pause
  goto :fail
)

echo [Album] Starting backend on http://localhost:3000 ...
start "Album Backend" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

echo [Album] Starting frontend on http://localhost:5173 ...
start "Album Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo [Album] Backend and frontend started in separate windows.
echo [Album] Open http://localhost:5173
popd
exit /b 0

:fail
popd
exit /b 1
