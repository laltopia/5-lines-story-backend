const { clerkClient, requireAuth } = require('@clerk/express');

// Middleware para verificar se está autenticado
const requireAuthentication = requireAuth({
  onError: (error) => {
    return {
      status: 401,
      message: 'Unauthorized - Please log in'
    };
  }
});

// Middleware para verificar plano premium
const requirePremium = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const user = await clerkClient.users.getUser(userId);
    
    // Verificar se tem metadata de premium
    const isPremium = user.publicMetadata?.premium === true;
    
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: 'This feature requires a premium subscription'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  requireAuthentication,
  requirePremium
};
