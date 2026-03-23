# start-agency.ps1
# Unified Launcher for Ardeno OS x MiroFish

Write-Host "🚀 Launching Ardeno OS x MiroFish Agency..." -ForegroundColor Cyan

# 1. Start MiroFish Backend
Write-Host "Starting MiroFish Backend Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd services/mirofish/backend; python main.py"

# 2. Start Ardeno OS Frontend
Write-Host "Starting Ardeno OS Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/os; npm run dev"

Write-Host "✅ Agency components are initializing." -ForegroundColor Green
Write-Host "- OS Dashboard: http://localhost:5173"
Write-Host "- MiroFish API: http://localhost:5001"
