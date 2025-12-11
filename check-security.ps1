# Pre-Deploy Security Check Script

Write-Host "Verificando seguridad antes de deploy..." -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Check 1: Verificar que .env NO esta en git
Write-Host "Verificando .env en git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($gitStatus -match "\.env$|\.env ") {
    Write-Host "ERROR: .env esta en git! NO LO SUBAS!" -ForegroundColor Red
    Write-Host "Ejecuta: git rm --cached .env" -ForegroundColor Yellow
    $errors++
} else {
    Write-Host "OK: .env no esta rastreado por git" -ForegroundColor Green
}
Write-Host ""

# Check 2: Verificar .gitignore
Write-Host "Verificando .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore" -Raw
    if ($gitignore -match "\.env") {
        Write-Host "OK: .gitignore contiene .env" -ForegroundColor Green
    } else {
        Write-Host "ERROR: .gitignore NO contiene .env" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "ERROR: .gitignore no existe!" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 3: Verificar vite.config.ts
Write-Host "Verificando vite.config.ts..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    if ($viteConfig -match "GEMINI_API_KEY.*JSON\.stringify") {
        Write-Host "ERROR: vite.config.ts expone GEMINI_API_KEY!" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "OK: vite.config.ts NO expone GEMINI_API_KEY" -ForegroundColor Green
    }
}
Write-Host ""

# Resumen
Write-Host "RESUMEN DE SEGURIDAD" -ForegroundColor Cyan
Write-Host "Errores: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "SEGURIDAD OK - Listo para deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Configura variables en Vercel Dashboard" -ForegroundColor White
    Write-Host "2. git add ." -ForegroundColor White
    Write-Host "3. git commit -m 'Deploy seguro'" -ForegroundColor White
    Write-Host "4. git push origin main" -ForegroundColor White
    exit 0
} else {
    Write-Host "HAY PROBLEMAS DE SEGURIDAD - NO HAGAS DEPLOY!" -ForegroundColor Red
    exit 1
}
