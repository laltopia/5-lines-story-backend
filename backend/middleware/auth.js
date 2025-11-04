const { clerkClient, requireAuth } = require('@clerk/express');

// ============================================
// 🔥 MIDDLEWARE SIMPLIFICADO - SEM VERIFICAÇÃO DE PLANOS
// ============================================

// Middleware para verificar se está autenticado (APENAS isso)
const requireAuthentication = requireAuth({
  onError: (error) => {
    return {
      status: 401,
      message: 'Unauthorized - Please log in'
    };
  }
});

// ============================================
// REMOVIDO: requirePremium
// ============================================
// Não há mais verificação de plano premium
// Todos os usuários têm acesso a tudo

module.exports = {
  requireAuthentication
  // requirePremium - REMOVIDO
};
