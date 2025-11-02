const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/supabase');
const { requireAuthentication } = require('../middleware/auth');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Prompt predeterminado
const SYSTEM_PROMPT = `Você é um assistente especializado em criar histórias criativas.
Quando o usuário te passar um tema ou ideia, você deve:
1. Criar uma história curta (3-5 parágrafos)
2. Usar linguagem envolvente e descritiva
3. Incluir início, meio e fim
4. Ser criativo e original

Responda sempre em português do Brasil.`;

// POST - Processar texto do usuário (PROTEGIDO)
router.post('/process', requireAuthentication, async (req, res) => {
  try {
    const { userInput } = req.body;
    const userId = req.auth.userId; // ID do usuário do Clerk
    
    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User input is required' 
      });
    }

    // Chamar API da Anthropic
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userInput
        }
      ]
    });

    const aiResponse = message.content[0].text;

    // Salvar no banco com user_id do Clerk
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_input: userInput,
        ai_response: aiResponse,
        prompt_used: SYSTEM_PROMPT,
        user_id: userId // IMPORTANTE: Salvar user_id
      }])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      userInput: userInput,
      aiResponse: aiResponse,
      conversationId: data[0].id
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET - Buscar histórico de conversas (PROTEGIDO E FILTRADO POR USUÁRIO)
router.get('/history', requireAuthentication, async (req, res) => {
  try {
    const userId = req.auth.userId; // ID do usuário do Clerk
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId) // IMPORTANTE: Filtrar por user_id
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      conversations: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
