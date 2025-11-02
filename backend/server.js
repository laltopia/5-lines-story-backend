require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Conectar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// Pagina inicial
app.get('/', (req, res) => {
  res.send(`
    <h1>Backend com Supabase - Versao 4.0</h1>
    <p>Endpoints disponiveis:</p>
    <ul>
      <li><a href="/api/users">/api/users</a> - Ver todos os usuarios</li>
      <li>POST /api/users - Criar novo usuario</li>
      <li><a href="/health">/health</a> - Status da conexao</li>
    </ul>
  `);
});

// Health check
app.get('/health', (req, res) => {
  const hasConfig = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
  res.json({ 
    status: 'ok',
    database: hasConfig ? 'configured' : 'not configured',
    timestamp: new Date()
  });
});

// Buscar todos os usuarios
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

// Criar novo usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email }])
      .select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'User created successfully!',
      user: data[0] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
