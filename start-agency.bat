@echo off
echo 🚀 Launching Ardeno OS x MiroFish Agency...

start powershell -NoExit -Command "cd services/mirofish/backend; python main.py"
start powershell -NoExit -Command "cd apps/os; npm run dev"

echo ✅ Agency components are initializing.
echo - OS Dashboard: http://localhost:5173
echo - MiroFish API: http://localhost:5001
pause
