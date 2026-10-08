@echo off setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================ rem Album - Local development setup rem ============================================================

pushd "%~dp0"

echo. echo ============================================================ echo Album - Local Development Setup echo ============================================================ echo.

rem ------------------------------------------------------------ rem Check Node.js rem ------------------------------------------------------------ echo [Album] Checking required tools...

where node >nul 2>nul if errorlevel 1 ( echo ERROR: Node.js 22 or newer is required and was not found in PATH. echo Install it from https://nodejs.org/ and open a new CMD window. pause goto :fail )

where npm >nul 2>nul if errorlevel 1 ( echo ERROR: npm was not found in PATH. pause goto :fail )

for /f "tokens=1 delims=." %%V in ('node --version') do set "NODEMAJOR=%%V" set "NODEMAJOR=%NODE_MAJOR:v=%"

if %NODE_MAJOR% LSS 22 ( echo ERROR: Node.js 22 or newer is required. echo Current version: node --version pause goto :fail )

echo [Album] Node.js version: node --version echo.

rem ------------------------------------------------------------ rem Find MySQL client rem ------------------------------------------------------------ set "MYSQL_CMD="

where mysql >nul 2>nul if not errorlevel 1 set "MYSQL_CMD=mysql"

if not defined MYSQLCMD if exist "C:\xampp\mysql\bin\mysql.exe" ( set "MYSQLCMD=C:\xampp\mysql\bin\mysql.exe" )

if not defined MYSQLCMD if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" ( set "MYSQLCMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" )

if not defined MYSQLCMD if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" ( set "MYSQLCMD=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" )

if not defined MYSQL_CMD ( echo ERROR: MySQL client was not found in PATH. echo. echo Add the MySQL bin directory to PATH or update the MySQL path in setup.bat. pause goto :fail )

echo [Album] MySQL client found: echo %MYSQL_CMD% echo.

rem ------------------------------------------------------------ rem MySQL connection rem ------------------------------------------------------------ echo [Album] Checking MySQL connection... echo. echo Enter the MySQL root password when prompted. echo.

"%MYSQL_CMD%" -u root -p -e "SELECT VERSION();" >nul if errorlevel 1 ( echo. echo ERROR: Could not connect to MySQL. echo. echo Check that: echo 1. MySQL is running. echo 2. The root password is correct. echo 3. The MySQL server is listening on port 3306. echo. pause goto :fail )

echo. echo [Album] MySQL connection OK. echo.

rem ------------------------------------------------------------ rem Database configuration rem ------------------------------------------------------------ set "DBNAME=photoalbums" set "DBHOST=127.0.0.1" set "DBPORT=3306"

rem ------------------------------------------------------------ rem Check if database already exists rem ------------------------------------------------------------ echo [Album] Checking database "%DB_NAME%"...

set "DB_EXISTS="

for /f "usebackq tokens=*" %%D in ("%MYSQL_CMD%" -u root -p -N -s -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='%DB_NAME%';") do ( set "DB_EXISTS=1" )

if defined DBEXISTS ( echo. echo WARNING: The database "%DBNAME%" already exists. echo. echo If this is an existing development database, keeping it is echo normally the safest option. echo. choice /C KS /N /M "Keep database or recreate it? [K/S]: "

if errorlevel 2 ( echo. echo [Album] Recreating database "%DB_NAME%"...

"%MYSQLCMD%" -u root -p -e "DROP DATABASE IF EXISTS %DBNAME%; CREATE DATABASE %DBNAME% CHARACTER SET utf8mb4 COLLATE utf8mb4unicode_ci;"

if errorlevel 1 ( echo. echo ERROR: Could not recreate the database. pause goto :fail )

echo [Album] Database recreated successfully. ) else ( echo. echo [Album] Keeping existing database "%DBNAME%". ) ) else ( echo. echo [Album] Creating database "%DBNAME%"...

"%MYSQLCMD%" -u root -p -e "CREATE DATABASE %DBNAME% CHARACTER SET utf8mb4 COLLATE utf8mb4unicodeci;"

if errorlevel 1 ( echo. echo ERROR: Could not create database "%DB_NAME%". pause goto :fail )

echo [Album] Database created successfully. )

echo.

rem ------------------------------------------------------------ rem Backend .env rem ------------------------------------------------------------ if not exist "backend.env" ( echo [Album] Creating backend.env...

for /f "delims=" %%S in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do ( set "JWT_SECRET=%%S" )

"backend.env" (

echo DATABASEURL="mysql://root:@%DBHOST%:%DBPORT%/%DBNAME%" echo PORT=3000 echo NODEENV=development echo CORSORIGIN="http://localhost:5173" echo JWTSECRET="!JWTSECRET!" echo JWTEXPIRESIN="1h" echo CLOUDINARYCLOUDNAME="" echo CLOUDINARYAPIKEY="" echo CLOUDINARYAPISECRET="" echo CLOUDINARYUPLOADPRESET="" echo STORAGEPROVIDER="local" echo UPLOADDIR="uploads" )

echo [Album] backend.env created. ) else ( echo [Album] Keeping existing backend.env. )

echo.

rem ------------------------------------------------------------ rem Frontend .env rem ------------------------------------------------------------ if not exist "frontend.env" ( echo [Album] Creating frontend.env...

"frontend.env" echo VITEAPIBASE_URL=http://localhost:3000/api

echo [Album] frontend.env created. ) else ( echo [Album] Keeping existing frontend.env. )

echo.

rem ------------------------------------------------------------ rem Upload directory rem ------------------------------------------------------------ if not exist "backend\uploads" ( echo [Album] Creating backend\uploads... mkdir "backend\uploads" )

rem ------------------------------------------------------------ rem Backend dependencies rem ------------------------------------------------------------ echo [Album] Installing backend dependencies... echo.

pushd "backend"

call npm ci if errorlevel 1 ( popd echo. echo ERROR: Backend dependency installation failed. pause goto :fail )

echo. echo [Album] Generating Prisma Client...

call npm run prisma:generate if errorlevel 1 ( popd echo. echo ERROR: Prisma client generation failed. pause goto :fail )

echo. echo [Album] Applying Prisma migrations...

call npx prisma migrate deploy if errorlevel 1 ( popd echo. echo ERROR: Prisma migrations failed. echo. echo The database may be unavailable or incompatible with the echo current Prisma schema. pause goto :fail )

echo. echo [Album] Seeding database...

call npm run prisma:seed if errorlevel 1 ( popd echo. echo ERROR: Database seed failed. echo. echo If this is a fresh development installation, run setup.bat echo again and choose "S" to recreate the database. pause goto :fail )

popd

rem ------------------------------------------------------------ rem Frontend dependencies rem ------------------------------------------------------------ echo. echo [Album] Installing frontend dependencies... echo.

pushd "frontend"

call npm ci if errorlevel 1 ( popd echo. echo ERROR: Frontend dependency installation failed. pause goto :fail )

popd

rem ------------------------------------------------------------ rem Finished rem ------------------------------------------------------------ echo. echo ============================================================ echo Album setup completed successfully! echo ============================================================ echo. echo Run start.bat to start the application. echo.

popd exit /b 0

rem ------------------------------------------------------------ rem Failure rem ------------------------------------------------------------ :fail

echo. echo ============================================================ echo Album setup did not complete. echo ============================================================ echo.

popd exit /b 1
