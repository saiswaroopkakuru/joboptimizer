@echo off
title Sai Swaroop Reddy - Superman: Symbol of Hope Launcher
cls
echo ======================================================
echo          Sai Swaroop Reddy - Superman: Symbol of Hope Launcher
echo ======================================================
echo.
echo Starting the Superman: Symbol of Hope Dashboard Server...
echo.
echo Server running at http://localhost:8000
echo Close this terminal window or press Ctrl+C to shut down the server.
echo.
if "%1"=="--no-browser" goto start_server
start "" "http://localhost:8000"
:start_server
where uv >nul 2>nul
if %ERRORLEVEL% equ 0 (
    uv run server.py
) else (
    "%USERPROFILE%\.local\bin\uv.exe" run server.py
)

