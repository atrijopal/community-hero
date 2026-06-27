# deploy.ps1 — Build frontend + deploy backend to App Engine asia-south1
# Run from: d:\VIBE2SHIP\community-hero\
# Prerequisites: gcloud CLI installed and authenticated

$ErrorActionPreference = "Stop"

Write-Host "=== Step 1: Build React frontend ===" -ForegroundColor Cyan
Set-Location frontend
npm run build
if (-not $?) { Write-Error "Frontend build failed"; exit 1 }

Write-Host "=== Step 2: Copy build output to backend/public ===" -ForegroundColor Cyan
Set-Location ..
if (Test-Path "backend\public") {
    Remove-Item -Recurse -Force "backend\public"
}
Copy-Item -Recurse "frontend\build" "backend\public"
Write-Host "Copied frontend/build -> backend/public"

Write-Host "=== Step 3: Deploy to App Engine ===" -ForegroundColor Cyan
Set-Location backend
gcloud app deploy app.yaml --project=community-hero-fc07d --region=asia-south1 --quiet
if (-not $?) { Write-Error "gcloud deploy failed"; exit 1 }

Set-Location ..
Write-Host ""
Write-Host "=== DEPLOYED ===" -ForegroundColor Green
Write-Host "Live at: https://community-hero-fc07d.appspot.com" -ForegroundColor Green
