# 🚀 Guia de Deploy no Render - Passo a Passo

## 📋 Pré-requisitos

- Conta no Render (https://render.com)
- Código no GitHub
- Todas as credenciais das APIs (Clerk, Supabase, Anthropic)

## 🔧 Configuração no Dashboard do Render

### Passo 1: Criar Novo Serviço Web

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `laltopia/5-lines-story-backend`
4. Selecione a branch: `claude/rewrite-nextjs-optimize-011CUotiaPQDPkMNLqN22EQ5`

### Passo 2: Configurar Build Settings

**IMPORTANTE:** Configure exatamente assim:

```
Name: 5-lines-story
Environment: Node
Region: Escolha sua região (ex: Oregon)
Branch: claude/rewrite-nextjs-optimize-011CUotiaPQDPkMNLqN22EQ5

Build Command: npm ci && npm run build
Start Command: ./start.sh

Node Version: 18.17.0
```

### Passo 3: Adicionar Variáveis de Ambiente

Clique em **"Advanced"** e adicione **TODAS** essas variáveis:

| Key | Value | Exemplo |
|-----|-------|---------|
| `NODE_ENV` | `production` | production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sua chave pública do Clerk | pk_test_... |
| `CLERK_SECRET_KEY` | Sua chave secreta do Clerk | sk_test_... |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase | eyJh... |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase | eyJh... |
| `ANTHROPIC_API_KEY` | Chave da API Anthropic | sk-ant-... |

### Passo 4: Criar o Serviço

1. Revise todas as configurações
2. Clique em **"Create Web Service"**
3. Aguarde o primeiro deploy (pode levar 5-10 minutos)

## 🔍 Verificando o Deploy

### Logs Esperados no Build:

```
Cloning repository...
Installing dependencies...
npm ci
Building application...
npm run build
✓ Creating an optimized production build
✓ Compiled successfully
Build completed successfully!
```

### Logs Esperados no Start:

```
Starting service...
🔍 Checking for production build...
✅ Production build found!
🚀 Starting production server...
✓ Ready on http://0.0.0.0:10000
```

## ❌ Troubleshooting - Erros Comuns

### Erro: "Could not find a production build"

**Causa:** O build command não foi executado ou falhou.

**Solução:**

1. Vá em **Settings** → **Build & Deploy**
2. Confirme que o **Build Command** é: `npm ci && npm run build`
3. Confirme que o **Start Command** é: `./start.sh`
4. Clique em **"Manual Deploy"** → **"Clear build cache & deploy"**

### Erro: "Permission denied: ./start.sh"

**Causa:** O arquivo start.sh não tem permissão de execução.

**Solução:** O arquivo já tem permissão no repositório. Se o erro persistir:

1. Faça um novo commit com:
```bash
git update-index --chmod=+x start.sh
git commit -m "fix: ensure start.sh is executable"
git push
```

### Erro: "Module not found" ou "Cannot find package"

**Causa:** Dependências não instaladas corretamente.

**Solução:**

1. Verifique se todas as dependências estão no `package.json`
2. Use **"Clear build cache & deploy"** no Render
3. Tente mudar o build command para: `rm -rf node_modules && npm ci && npm run build`

### Erro: Build muito lento ou timeout

**Causa:** Plano Free do Render tem recursos limitados.

**Solução:**

1. Remova `devDependencies` não essenciais
2. Use `npm ci` em vez de `npm install` (mais rápido)
3. Considere upgrade do plano

## 🎯 Checklist Final

Antes de fazer deploy, confirme:

- ✅ Branch correta selecionada
- ✅ Build Command: `npm ci && npm run build`
- ✅ Start Command: `./start.sh`
- ✅ Node Version: 18.17.0+
- ✅ Todas as 7 variáveis de ambiente configuradas
- ✅ Variáveis sem espaços extras ou caracteres invisíveis
- ✅ start.sh tem permissão de execução

## 📞 Suporte

Se o problema persistir:

1. Copie os logs completos do deploy
2. Verifique se o build funciona localmente:
   ```bash
   npm ci
   npm run build
   npm start
   ```
3. Compare as versões de Node local vs Render

## 🚀 Deploy Manual de Emergência

Se tudo falhar, use este comando único:

```bash
Build Command: npm ci && npm run build && chmod +x start.sh
Start Command: bash start.sh
```

Isso força a instalação, build e execução em sequência.

---

**Última atualização:** 2025-11-05
