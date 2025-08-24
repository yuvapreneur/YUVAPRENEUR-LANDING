@echo off
title Cafe Masterclass Server
color 0A
echo.
echo ========================================
echo    Cafe Masterclass Server Launcher
echo ========================================
echo.
echo Starting server...
echo.
cd /d "%~dp0"
node server.js
echo.
echo Server stopped. Press any key to exit...
pause >nul
