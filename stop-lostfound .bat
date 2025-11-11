@echo off
cd /d "%~dp0"
echo Stopping containers...
docker compose down
echo ✅ Stopped.
pause