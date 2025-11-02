require('dotenv').config();
const express = require('express');
const path = require('path');
const { clerkMiddleware } = require('@clerk/express');

const usersRouter = require('./routes/users');
const aiRouter = require('./routes/ai');

const app = express();

// Middlewares
app.use(express.json());
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

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
    version: '9.0',
    clerk: process.env.CLERK_PUBLISHABLE_KEY ? 'configured' : 'not configured',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
  });
});

// Endpoint para verificar sessão do usuário
app.get('/api/me', (req, res) => {
  if (req.auth?.userId) {
    res.json({
      authenticated: true,
      userId: req.auth.userId
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
