@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "DB_PASSWORD=album_dev_local_password"

rem Prepare the local development environment from the repository root.
pushd "%~dp0"

echo [Album] Checking required tools...
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 22 or newer is required and was not found in PATH.
  echo Install it from https://nodejs.org/ and open a new CMD window.
  goto :fail
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found in PATH.
  goto :fail
)
set "MYSQL_CMD="
where mysql >nul 2>nul
if not errorlevel 1 set "MYSQL_CMD=mysql"
if not defined MYSQL_CMD if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_CMD=C:\xampp\mysql\bin\mysql.exe"
if not defined MYSQL_CMD if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not defined MYSQL_CMD if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
if not defined MYSQL_CMD (
  echo ERROR: MySQL client was not found in PATH.
  echo Add the MySQL bin directory to PATH or update the MySQL path in setup.bat.
  goto :fail
)

for /f "tokens=1 delims=." %%V in ('node --version') do set "NODE_MAJOR=%%V"
set "NODE_MAJOR=%NODE_MAJOR:v=%"
if %NODE_MAJOR% LSS 22 (
  echo ERROR: Node.js 22 or newer is required.
  goto :fail
)

echo [Album] Creating the local MySQL database and user...
"%MYSQL_CMD%" -u root -p -e "CREATE DATABASE IF NOT EXISTS photo_albums CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'album_dev'@'localhost' IDENTIFIED BY '%DB_PASSWORD%'; ALTER USER 'album_dev'@'localhost' IDENTIFIED BY '%DB_PASSWORD%'; GRANT ALL PRIVILEGES ON photo_albums.* TO 'album_dev'@'localhost'; FLUSH PRIVILEGES;"
if errorlevel 1 (
  echo ERROR: MySQL setup failed. Check that MySQL is running and that the root password is correct.
  goto :fail
)

if not exist "backend\.env" (
  echo [Album] Creating backend\.env...
  for /f "delims=" %%S in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set "JWT_SECRET=%%S"
  >"backend\.env" (
    echo DATABASE_URL="mysql://album_dev:%DB_PASSWORD%@127.0.0.1:3306/photo_albums"
    echo PORT=3000
    echo NODE_ENV=development
    echo CORS_ORIGIN="http://localhost:5173"
    echo JWT_SECRET="!JWT_SECRET!"
    echo JWT_EXPIRES_IN="1h"
    echo CLOUDINARY_CLOUD_NAME=""
    echo CLOUDINARY_API_KEY=""
    echo CLOUDINARY_API_SECRET=""
    echo CLOUDINARY_UPLOAD_PRESET=""
    echo STORAGE_PROVIDER="local"
    echo UPLOAD_DIR="uploads"
  )
) else (
  echo [Album] Keeping existing backend\.env.
)

if not exist "frontend\.env" (
  echo [Album] Creating frontend\.env...
  >"frontend\.env" echo VITE_API_BASE_URL=http://localhost:3000/api
) else (
  echo [Album] Keeping existing frontend\.env.
)

if not exist "backend\uploads" mkdir "backend\uploads"

echo [Album] Installing backend dependencies...
pushd "backend"
call npm ci
if errorlevel 1 (
  popd
  echo ERROR: Backend dependency installation failed.
  goto :fail
)
call npm run prisma:generate
if errorlevel 1 (
  popd
  echo ERROR: Prisma client generation failed.
  goto :fail
)
call npx prisma migrate deploy
if errorlevel 1 (
  popd
  echo ERROR: Prisma migrations failed.
  goto :fail
)
call npm run prisma:seed
if errorlevel 1 (
  popd
  echo ERROR: Database seed failed.
  goto :fail
)
popd

echo [Album] Installing frontend dependencies...
pushd "frontend"
call npm ci
if errorlevel 1 (
  popd
  echo ERROR: Frontend dependency installation failed.
  goto :fail
)
popd

echo.
echo [Album] Setup complete. Run start.bat to start the application.
popd
exit /b 0

:fail
echo.
echo [Album] Setup did not complete.
popd
exit /b 1
