# CleanerCorecon - Database Setup Script (PowerShell)
# Run this script after installing PostgreSQL 16

Write-Host "=== CleanerCorecon DB Setup ===" -ForegroundColor Cyan

$envPath = ".env"
$defaultEnvPath = ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Host "Creating $envPath from .env.example..." -ForegroundColor Yellow
    Copy-Item $defaultEnvPath $envPath
}

$envContent = Get-Content $envPath
$dbHost = Select-String -Path $envPath -Pattern "^DB_HOST=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
$dbPort = Select-String -Path $envPath -Pattern "^DB_PORT=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
$dbUser = Select-String -Path $envPath -Pattern "^DB_USER=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
$dbPass = Select-String -Path $envPath -Pattern "^DB_PASSWORD=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
$dbName = Select-String -Path $envPath -Pattern "^DB_NAME=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if (-not $dbHost) { $dbHost = "localhost" }
if (-not $dbPort) { $dbPort = "5432" }
if (-not $dbUser) { $dbUser = "corecon" }
if (-not $dbPass) { $dbPass = "changeme" }
if (-not $dbName) { $dbName = "corecon" }

Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  Host:     $dbHost"
Write-Host "  Port:     $dbPort"
Write-Host "  User:     $dbUser"
Write-Host "  Database: $dbName"

$env:PGPASSWORD = $dbPass
$psqlBase = "psql -h $dbHost -p $dbPort -U postgres"

Write-Host "`n[1/3] Creating database user '$dbUser'..." -ForegroundColor Yellow
& cmd /c "$psqlBase -c ""CREATE USER $dbUser WITH PASSWORD '$dbPass';"" 2>nul"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  User created" -ForegroundColor Green
} else {
    Write-Host "  User may already exist (continuing)" -ForegroundColor Gray
}

Write-Host "[2/3] Creating database '$dbName'..." -ForegroundColor Yellow
& cmd /c "$psqlBase -c ""CREATE DATABASE $dbName OWNER $dbUser;"" 2>nul"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Database created" -ForegroundColor Green
} else {
    Write-Host "  Database may already exist (continuing)" -ForegroundColor Gray
}

Write-Host "[3/3] Granting privileges..." -ForegroundColor Yellow
& cmd /c "$psqlBase -c ""GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;"" 2>nul"

Write-Host "`n=== Running Migrations ===" -ForegroundColor Cyan
pnpm --filter @corecon/api migration:run

Write-Host "`n=== Running Seed ===" -ForegroundColor Cyan
pnpm --filter @corecon/api seed

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Admin: admin@corecon.us / Admin123!" -ForegroundColor Green
Write-Host "Cleaner: juan@corecon.us / Cleaner123!" -ForegroundColor Green
