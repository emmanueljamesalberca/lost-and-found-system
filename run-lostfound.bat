@echo on
setlocal ENABLEDELAYEDEXPANSION

REM === always start in this .bat's folder ===
cd /d "%~dp0" || (echo Failed to cd into script folder & pause & exit /b 1)

REM === simple log file ===
set LOG=run-lostfound.log
echo [%DATE% %TIME%] Starting Lost & Found > "%LOG%"

REM === is Docker CLI available? ===
where docker >>"%LOG%" 2>&1 || (
  echo Docker CLI not found. Start Docker Desktop, then try again.
  pause & exit /b 1
)

REM === is the engine running? (Docker Desktop open) ===
docker version >>"%LOG%" 2>&1 || (
  echo Docker engine not running. Launching Docker Desktop...
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  timeout /t 10 >nul
  docker version >>"%LOG%" 2>&1 || (
    echo Still not running. Please open Docker Desktop manually, then rerun.
    pause & exit /b 1
  )
)

REM === bring up the stack ===
docker compose up -d >>"%LOG%" 2>&1 || goto :err

REM === show status ===
docker compose ps >>"%LOG%" 2>&1
docker compose ps

REM === open site ===
start "" "http://localhost:8080/"
echo .
echo ✅ Running. Browser opened at http://localhost:8080
pause
exit /b 0

:err
echo ❌ Failed to start containers. Opening log...
notepad "%LOG%"
pause
exit /b 1

