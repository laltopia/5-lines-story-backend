# 🚀 Meu Backend

Backend desenvolvido para conectar com app mobile.

## Endpoints Disponíveis

### Principal
- `GET /` - Status do servidor
- `GET /health` - Health check

### Usuários
- `GET /api/users` - Listar todos os usuários
- `POST /api/users` - Criar novo usuário
- `GET /api/users/:id` - Buscar usuário por ID

## Como testar

### Health Check
```bash
https://seu-app.onrender.com/health
```

### Criar Usuário
```bash
POST https://seu-app.onrender.com/api/users
Content-Type: application/json

{
  "email": "teste@example.com",
  "name": "Usuario Teste"
}
```

## Tecnologias
- Node.js + Express
- Supabase (PostgreSQL)
- Render (Deploy)
```

4. Commit: `Update README`

✅ **Seu repositório está pronto!** Você deve ter 4 arquivos:
- README.md
- package.json
- server.js
- .gitignore

---

## **PARTE 3: CONFIGURAR SUPABASE**

### Passo 3.1: Criar Conta no Supabase

1. Acesse: **https://supabase.com**
2. Clique **Start your project**
3. **Sign in with GitHub** (use sua conta GitHub)
4. Autorize o Supabase

### Passo 3.2: Criar Projeto

1. Clique **New project**
2. Preencha:
   - **Organization**: (selecione ou crie uma)
   - **Name**: `meu-backend-db`
   - **Database Password**: crie uma senha forte
     - Exemplo: `MinhaS3nh@Fort3!2024`
     - ⚠️ **COPIE E GUARDE ESSA SENHA!**
   - **Region**: South America (São Paulo)
   - **Pricing Plan**: Free
3. Clique **Create new project**
4. ⏰ Aguarde 2 minutos (criando infraestrutura)

### Passo 3.3: Copiar Credenciais

Quando terminar de criar:

1. No menu lateral → **Project Settings** (ícone de engrenagem)
2. Clique em **API**
3. **COPIE E GUARDE** em um bloco de notas:
```
Project URL: https://xxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
service_role key: (clique em "Reveal" para ver) eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
