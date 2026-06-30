@echo off
echo ===================================================
echo   Locating and Starting ViralGen AI Suite...
echo ===================================================
echo.

:: Get the directory of this batch file
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Now call the local run script
if exist "run_local.bat" (
    call run_local.bat
) else (
    echo [ERROR] Could not find run_local.bat!
    echo Please make sure you are running this from the ayushi git directory on Desktop.
    pause
)
