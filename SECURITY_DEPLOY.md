# 🔐 GUÍA DE SEGURIDAD ANTES DE DEPLOY

## ⚠️ CRÍTICO - VERIFICAR ANTES DE HACER DEPLOY

### 1. ✅ Verificar que `.env` NO está en GitHub

```bash
# Ejecutar este comando para verificar:
git status

# Si ves .env en la lista, ¡NO LO SUBAS!
# Ejecuta:
git rm --cached .env
```

### 2. ✅ Verificar `.gitignore`

El archivo `.gitignore` debe contener:
```
.env
.env.*
!.env.example
*.env
```

### 3. ✅ Variables de Entorno en Vercel

En **Vercel Dashboard** → **Project Settings** → **Environment Variables**, agrega:

#### 🟢 Variables para PRODUCTION:
- `GEMINI_API_KEY` = tu-api-key-de-gemini
- `SUPABASE_SERVICE_ROLE_KEY` = tu-service-role-key
- `VITE_SUPABASE_URL` = https://tu-proyecto.supabase.co
- `VITE_SUPABASE_ANON_KEY` = tu-anon-key

#### 🔵 Variables OPCIONALES:
- `VITE_ADSENSE_SLOT` = tu-slot-id
- `VITE_ADSENSE_SLOT_RSPV` = tu-rspv-slot
- `VITE_ADSENSE_SLOT_MCRSPV` = tu-mcrspv-slot

### 4. ✅ Archivos que NUNCA deben subirse a GitHub

- ❌ `.env` (contiene secretos)
- ❌ `node_modules/` (muy grande)
- ❌ `dist/` (archivos compilados)
- ❌ Scripts de base de datos con claves (`query-db.js`, etc.)

### 5. ✅ Archivos SEGUROS para subir

- ✅ `.env.example` (sin claves reales)
- ✅ `src/`, `components/`, `api/` (código fuente)
- ✅ `package.json`, `vite.config.ts`
- ✅ `.gitignore`

### 6. 🔒 Verificación de Seguridad

#### Verifica que GEMINI_API_KEY NO esté en el código público:

```bash
# Buscar en el código compilado (después de build):
npm run build
# Luego revisa dist/ - NO debe contener tu API key
```

#### El archivo `vite.config.ts` ahora es seguro:
- ❌ REMOVIDO: `GEMINI_API_KEY` del bundle público
- ✅ SOLO expone: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (seguros)

### 7. 📝 Comandos para Deploy Seguro

```bash
# 1. Verificar que no hay secretos
git status

# 2. Agregar solo archivos seguros
git add .

# 3. Commit
git commit -m "Deploy seguro - sin secretos"

# 4. Push a GitHub
git push origin main

# 5. Vercel desplegará automáticamente y usará las variables de entorno configuradas
```

### 8. 🚨 Si accidentalmente subiste .env a GitHub:

```bash
# 1. Remover del historial
git rm --cached .env

# 2. Commit
git commit -m "Remove .env from repository"

# 3. Push
git push origin main

# 4. CRÍTICO: Regenerar TODAS las API keys porque ya están comprometidas
# - Nueva API key de Gemini: https://aistudio.google.com/app/apikey
# - Nuevo service role key de Supabase: https://supabase.com/dashboard
```

## ✅ CHECKLIST FINAL ANTES DE DEPLOY

- [ ] `.env` está en `.gitignore`
- [ ] `.env` NO aparece en `git status`
- [ ] Variables configuradas en Vercel Dashboard
- [ ] `vite.config.ts` NO expone `GEMINI_API_KEY`
- [ ] Probado localmente con `npm run dev`
- [ ] Build funciona con `npm run build`
- [ ] No hay errores en consola

## 🎯 Arquitectura de Seguridad

### Cliente (Browser):
- ✅ Accede a Supabase con `VITE_SUPABASE_ANON_KEY` (limitada)
- ✅ Llama a `/api/gemini` (serverless function)
- ❌ NO tiene acceso directo a `GEMINI_API_KEY`

### Servidor (Vercel Functions):
- ✅ `api/gemini.ts` usa `GEMINI_API_KEY` de variables de entorno
- ✅ Procesa requests del cliente de forma segura
- ✅ Retorna solo resultados, nunca claves

## 📚 Recursos

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Gemini API Security](https://ai.google.dev/gemini-api/docs/api-key)
