@echo off
title Discord Poker - Cloudflare Tunnel
echo.
echo ============================================
echo   Discord Poker Bot - Cloudflare Tunnel
echo ============================================
echo.

:: Kill old processes
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 >nul

:: Start cloudflared tunnel in background and capture URL
echo [1/3] Starting Cloudflare Tunnel...
start /B "" "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001 > "%TEMP%\cloudflare_output.txt" 2>&1

:: Wait for tunnel URL
echo Waiting for tunnel URL...
:WAIT_LOOP
timeout /t 2 >nul
findstr /C:"trycloudflare.com" "%TEMP%\cloudflare_output.txt" >nul 2>&1
if errorlevel 1 goto WAIT_LOOP

:: Extract URL
for /f "tokens=*" %%a in ('findstr /C:"trycloudflare.com" "%TEMP%\cloudflare_output.txt"') do set TUNNEL_LINE=%%a
:: Parse the URL from the line
for /f "tokens=2 delims=|" %%u in ("%TUNNEL_LINE%") do set TUNNEL_URL=%%u
:: Trim spaces
for /f "tokens=*" %%t in ("%TUNNEL_URL%") do set TUNNEL_URL=%%t

echo.
echo [2/3] Tunnel URL: %TUNNEL_URL%
echo.

:: Build frontend
echo [3/3] Starting server...
set PORT=3001
node start-public.js %TUNNEL_URL%

pause
