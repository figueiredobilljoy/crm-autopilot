@echo off
title ShopPilot AI - Production Server
echo ===================================================
echo   ShopPilot AI CRM - Production Launcher
echo ===================================================
echo.

cd /d "%~dp0"

if not exist "dist" (
  echo [1/2] Building frontend bundle...
  call npm.cmd run build
) else (
  echo [1/2] Production build found in /dist.
)

echo [2/2] Starting server on http://localhost:3001 ...
echo.
echo Opening browser at http://localhost:3001 ...
start http://localhost:3001

node server/index.js
pause
