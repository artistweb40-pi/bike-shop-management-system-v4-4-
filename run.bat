@echo off
setlocal enabledelayedexpansion

title Usman Trader and Autos - Bike Showroom Management System

echo ======================================================================
echo    USMAN TRADER AND AUTOS - SHOWROOM MANAGEMENT SYSTEM
echo ======================================================================
echo.

:: 1. Check if running from Windows Temp folder (unextracted zip preview)
echo %CD% | findstr /I "AppData\\Local\\Temp" >nul
if %ERRORLEVEL% equ 0 (
    echo [ERROR] YOU ARE RUNNING THIS FROM INSIDE A COMPRESSED ZIP PREVIEW!
    echo.
    echo Windows cannot run Node.js/npm directly from inside a .zip file.
    echo.
    echo HOW TO FIX THIS IN 3 EASY STEPS:
    echo   1. Close this window.
    echo   2. Right-click your downloaded .zip file and click "Extract All...".
    echo   3. Choose a destination folder (e.g. C:\BikeShop or Desktop\BikeShop)
    echo      and click "Extract".
    echo   4. Open that extracted folder and double-click "run.bat" again.
    echo.
    echo ======================================================================
    pause
    exit /b 1
)

:: 2. Check if package.json is in a subfolder (e.g. if extracted with nested folder)
if not exist "package.json" (
    for /d %%D in (*) do (
        if exist "%%D\package.json" (
            echo Found project files in folder "%%D". Entering folder...
            cd "%%D"
            goto :FOUND_PACKAGE
        )
    )
    echo [ERROR] package.json was not found in:
    echo   %CD%
    echo.
    echo Please make sure all files were extracted from the .zip file.
    echo ======================================================================
    pause
    exit /b 1
)

:FOUND_PACKAGE

:: 3. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in your Windows PATH!
    echo Please download and install Node.js (LTS version) from:
    echo   https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 4. Check if node_modules exists, otherwise install dependencies
if not exist "node_modules\" (
    echo [1/2] Installing required dependencies (first run only)...
    echo       Please wait a minute while npm downloads packages...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] npm install encountered an issue. Retrying with legacy peer deps...
        call npm install --legacy-peer-deps
    )
    echo [1/2] Dependencies installed successfully!
) else (
    echo [1/2] Dependencies already installed.
)

:: 5. Launch the application
echo.
echo [2/2] Starting development server...
echo.
echo ======================================================================
echo   Showroom System is starting!
echo   Open in your browser: http://localhost:3000
echo   Keep this window OPEN while using the app.
echo   Press Ctrl+C in this window to stop the server when done.
echo ======================================================================
echo.

:: Automatically open default browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

call npm run dev

pause
