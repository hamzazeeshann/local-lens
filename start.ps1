# Local Lens — Full Setup Script
# Run this ONE TIME after cloning / first setup
# Usage: .\start.ps1

Write-Host "🔭 Local Lens Setup" -ForegroundColor Cyan

# 1. Start Docker containers
Write-Host "`n[1/5] Starting Docker (Postgres + Redis)..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 6

# 2. Run Prisma migration
Write-Host "`n[2/5] Running database migration..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://locallens:secret@localhost:5432/locallens"
npx prisma migrate dev --name init

# 3. Set up DB triggers + indexes
Write-Host "`n[3/5] Creating SQL triggers and indexes..." -ForegroundColor Yellow
node scripts/setup-triggers.mjs

# 4. Seed cities + countries
Write-Host "`n[4/5] Seeding cities and countries..." -ForegroundColor Yellow
npm run db:seed

# 5. Start dev server
Write-Host "`n[5/5] Starting dev server..." -ForegroundColor Green
Write-Host "➜ Open: http://localhost:3000" -ForegroundColor Cyan
npm run dev
