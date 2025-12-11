# 🔐 CHECKLIST DE SEGURIDAD - ANTES DE DEPLOY

## ✅ VERIFICACIÓN COMPLETADA

Tu proyecto está configurado de forma SEGURA para deploy:

### 1. ✅ Variables de Entorno Protegidas
- `.env` está en `.gitignore` ✓
- `.env` NO está rastreado por git ✓
- `.env.example` creado (sin claves reales) ✓

### 2. ✅ API Keys Protegidas
- `GEMINI_API_KEY` NO se expone en el código público ✓
- `vite.config.ts` solo expone variables VITE_* seguras ✓
- Sin claves hardcodeadas en el código ✓

### 3. ✅ Arquitectura Segura Implementada

```
┌─────────────────────────────────────────────────┐
│  CLIENTE (Browser)                              │
│  - Solo accede a VITE_SUPABASE_URL              │
│  - Solo accede a VITE_SUPABASE_ANON_KEY         │
│  - Llama a /api/gemini (serverless)             │
│  ❌ NO tiene acceso directo a GEMINI_API_KEY    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  SERVIDOR (Vercel Functions /api)               │
│  - api/gemini.ts usa GEMINI_API_KEY             │
│  - Variables de entorno de Vercel               │
│  - Procesa requests de forma segura             │
│  ✅ Keys solo en servidor                       │
└─────────────────────────────────────────────────┘
```

## 📋 PRÓXIMOS PASOS PARA DEPLOY

### Paso 1: Configurar Variables en Vercel

Ve a [Vercel Dashboard](https://vercel.com/dashboard) → Tu Proyecto → Settings → Environment Variables

Agrega estas variables:

```bash
# OBLIGATORIAS
GEMINI_API_KEY=AIzaSy... (tu key real)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... (tu key real)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (tu key real)

# OPCIONALES
VITE_ADSENSE_SLOT=5652456930
VITE_ADSENSE_SLOT_RSPV=5652456930
VITE_ADSENSE_SLOT_MCRSPV=5652456930
```

### Paso 2: Verificar Seguridad

```bash
# Ejecutar script de verificación
powershell -ExecutionPolicy Bypass -File check-security.ps1
```

### Paso 3: Deploy a GitHub

```bash
# 1. Verificar estado
git status

# 2. Agregar archivos
git add .

# 3. Commit
git commit -m "Deploy seguro con protección de API keys"

# 4. Push
git push origin main
```

### Paso 4: Vercel Deploy Automático

Vercel detectará el push y desplegará automáticamente usando las variables de entorno configuradas.

## 🚨 IMPORTANTE - NO HAGAS ESTO

❌ NO subas `.env` a GitHub
❌ NO expongas `GEMINI_API_KEY` en el código del cliente
❌ NO uses `VITE_GEMINI_API_KEY` (se expone públicamente)
❌ NO compartas tus API keys en capturas de pantalla o logs

## ✅ ESTO ES SEGURO

✅ Usar `.env` solo localmente
✅ Configurar variables en Vercel Dashboard
✅ Acceder a Gemini solo desde `/api/gemini.ts`
✅ Usar `VITE_*` solo para variables públicas seguras (URLs, IDs públicos)

## 🛠️ Si Algo Sale Mal

### Si accidentalmente subiste .env:

```bash
# 1. Remover del repositorio
git rm --cached .env
git commit -m "Remove .env from repository"
git push origin main

# 2. CRÍTICO: Regenerar TODAS las API keys
# - Nueva Gemini API: https://aistudio.google.com/app/apikey
# - Nuevo Supabase key: Dashboard → Settings → API
```

### Si ves tu API key en el código público:

1. Ve a Vercel → Settings → Environment Variables
2. Asegúrate que `GEMINI_API_KEY` esté ahí (sin el prefijo VITE_)
3. Verifica que `vite.config.ts` NO tenga `GEMINI_API_KEY` en `define`
4. Regenera la API key en Google AI Studio
5. Redeploy en Vercel

## 📚 Documentación Adicional

- [SECURITY_DEPLOY.md](./SECURITY_DEPLOY.md) - Guía completa de seguridad
- [.env.example](./.env.example) - Template de variables de entorno

## ✅ STATUS ACTUAL

- Fecha verificación: $(Get-Date -Format "yyyy-MM-dd HH:mm")
- Estado: SEGURO PARA DEPLOY ✓
- Errores de seguridad: 0
