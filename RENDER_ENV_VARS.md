# 🔐 VARIÁVEIS DE AMBIENTE - RENDER

## ⚠️ IMPORTANTE
Configure TODAS essas variáveis no Render Dashboard:
**Settings → Environment → Environment Variables**

## 📝 Lista Completa de Variáveis

### 1. NODE_ENV
```
Key: NODE_ENV
Value: production
```

### 2. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```
Key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_XXXXX (sua chave do Clerk)
```
⚠️ **CRITICAL:** Deve ter `NEXT_PUBLIC_` no início!

Como obter:
1. Acesse: https://dashboard.clerk.com
2. Vá em: API Keys
3. Copie: "Publishable key"

### 3. CLERK_SECRET_KEY
```
Key: CLERK_SECRET_KEY
Value: sk_test_XXXXX (sua chave secreta do Clerk)
```

Como obter:
1. Acesse: https://dashboard.clerk.com
2. Vá em: API Keys
3. Copie: "Secret key"

### 4. NEXT_PUBLIC_SUPABASE_URL
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://XXXXX.supabase.co
```
⚠️ **CRITICAL:** Deve ter `NEXT_PUBLIC_` no início!

Como obter:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → API
4. Copie: "Project URL"

### 5. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXX
```
⚠️ **CRITICAL:** Deve ter `NEXT_PUBLIC_` no início!

Como obter:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → API
4. Copie: "Project API keys" → "anon public"

### 6. SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXX
```

⚠️ **CUIDADO:** Esta é uma chave SECRETA! Não compartilhe!

Como obter:
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → API
4. Copie: "Project API keys" → "service_role" (clique em "Reveal")

### 7. ANTHROPIC_API_KEY
```
Key: ANTHROPIC_API_KEY
Value: sk-ant-XXXXX
```

Como obter:
1. Acesse: https://console.anthropic.com
2. Vá em: API Keys
3. Copie ou crie uma nova chave

---

## ✅ COMO ADICIONAR NO RENDER:

1. **Vá para:** https://dashboard.render.com
2. **Selecione** seu serviço (5-lines-story)
3. **Clique em:** "Environment" (menu lateral)
4. **Para cada variável acima:**
   - Clique em "Add Environment Variable"
   - Cole o **Key** (nome exato)
   - Cole o **Value** (sua chave)
   - Clique em "Save"

5. **Depois de adicionar TODAS:**
   - Clique em "Manual Deploy"
   - Clique em "Deploy"

---

## 🔍 COMO VERIFICAR SE ESTÁ CORRETO:

No Render, você deve ver exatamente isso:

```
✅ NODE_ENV = production
✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
✅ CLERK_SECRET_KEY = sk_test_...
✅ NEXT_PUBLIC_SUPABASE_URL = https://...supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJh...
✅ SUPABASE_SERVICE_ROLE_KEY = eyJh...
✅ ANTHROPIC_API_KEY = sk-ant-...
```

---

## ⚠️ ERROS COMUNS:

### 1. Nome errado:
❌ `CLERK_PUBLISHABLE_KEY`
✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### 2. Faltando NEXT_PUBLIC_:
❌ `SUPABASE_URL`
✅ `NEXT_PUBLIC_SUPABASE_URL`

### 3. Espaços extras:
❌ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ` (espaço no final)
✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (sem espaço)

### 4. Valor errado:
❌ Copiar "Secret key" onde deveria ser "Publishable key"
✅ Verificar duas vezes qual chave está copiando

---

## 🚀 DEPOIS DE CONFIGURAR:

1. Salve todas as variáveis
2. Faça um novo deploy manual
3. Aguarde 5-10 minutos
4. Teste o link: https://five-lines-story-backend.onrender.com
5. Deve funcionar! ✅

---

**Última atualização:** 2025-11-05
