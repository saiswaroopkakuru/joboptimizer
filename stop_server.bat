@echo off
title Stop Superman: Symbol of Hope Server
echo ======================================================
echo          Stopping Superman: Symbol of Hope Server (Port 8000)
echo ======================================================
echo.

set found=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr LISTENING ^| findstr :8000') do (
    echo Found server process with PID %%a listening on port 8000.
    echo Terminating process...
    taskkill /f /pid %%a
    set found=1
)

if "%found%"=="0" (
    echo No active process found listening on port 8000.
) else (
    echo.
    echo [SUCCESS] Server stopped successfully.
)

echo.
echo Press any key to exit.
pause > nul
