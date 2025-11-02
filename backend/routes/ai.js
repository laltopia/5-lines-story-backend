const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/supabase');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Prompt predeterminado - CUSTOMIZE AQUI!
const SYSTEM_PROMPT = `Você é um assistente especializado em criar histórias criativas.
Quando o usuário te passar um tema ou ideia, você deve:
1. Criar uma história curta (3-5 parágrafos)
2. Usar linguagem envolvente e descritiva
3. Incluir início, meio e fim
4. Ser criativo e original

Responda sempre em português do Brasil.`;

// POST - Processar texto do usuário
router.post('/process', async (req, res) => {
  try {
    const { userInput } = req.body;
    
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

    // Salvar no banco de dados
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_input: userInput,
        ai_response: aiResponse,
        prompt_used: SYSTEM_PROMPT
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

// GET - Buscar histórico de conversas
router.get('/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
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
