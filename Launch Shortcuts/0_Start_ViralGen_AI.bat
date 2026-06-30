@echo off
echo ===================================================
echo   Locating and Starting ViralGen AI Suite...
echo ===================================================
echo.

:: Get the directory of this batch file
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Check if viralgen-ai folder is next to this directory or if we are inside it
if exist "..\viralgen-ai" (
    cd "..\viralgen-ai"
) else if exist "viralgen-ai" (
    cd "viralgen-ai"
) else (
    :: Already in viralgen-ai directory or not found
)

:: Now call the local run script
if exist "run_local.bat" (
    call run_local.bat
) else (
    echo [ERROR] Could not find run_local.bat!
    echo Please make sure you are running this from the Ayushi directory or the viralgen-ai directory.
    pause
)
