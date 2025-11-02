require('dotenv').config();
const express = require('express');
const path = require('path');
const usersRouter = require('./routes/users');
const aiRouter = require('./routes/ai');

const app = express();
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas
app.use('/api/users', usersRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    version: '7.0',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
