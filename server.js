require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// Rota principal
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Backend Online!', 
    timestamp: new Date(),
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: process.env.SUPABASE_URL ? 'connected' : 'not configured',
    timestamp: new Date()
  });
});

// Buscar todos os usuários
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      count: data.length,
      users: data 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Criar novo usuário
app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email e nome são obrigatórios' 
      });
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, name }])
      .select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Usuário criado com sucesso!',
      user: data[0] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Buscar usuário por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      user: data 
    });
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      error: 'Usuário não encontrado' 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

4. Mensagem do commit: `Create server.js`
5. Clique **Commit changes**

### Passo 2.3: Criar .gitignore

1. **Add file** → **Create new file**
2. Nome: `.gitignore`
3. Conteúdo:
```
node_modules/
.env
.env.local
*.log
.DS_Store
