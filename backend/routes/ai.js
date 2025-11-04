const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/supabase');
const { requireAuthentication } = require('../middleware/auth');
const { clerkClient } = require('@clerk/express');
const { 
  getPrompt, 
  detectLanguage, 
  estimateTokens 
} = require('../config/prompts');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// Configuração de preços
const PRICING = {
  [MODEL]: {
    input: 3.00 / 1_000_000,
    output: 15.00 / 1_000_000
  }
};

// CONFIGURAÇÃO DE LIMITES POR PLANO
const PLAN_LIMITS = {
  'free': {
    monthly_story_limit: 3,
    tokens_limit_monthly: 5000
  },
  'plus': {
    monthly_story_limit: 50,
    tokens_limit_monthly: 75000
  },
  'pro': {
    monthly_story_limit: 150,
    tokens_limit_monthly: 220000
  }
};

// ============================================
// HELPERS
// ============================================

async function ensureUserLimit(userId) {
  // 1. Buscar plano do usuário no Clerk
  let userPlan = 'free'; // default
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    userPlan = clerkUser.publicMetadata?.plan || 'free';
    
    // Validar que o plano existe
    if (!PLAN_LIMITS[userPlan]) {
      console.warn(`Invalid plan "${userPlan}" for user ${userId}, defaulting to free`);
      userPlan = 'free';
    }
  } catch (error) {
    console.error('Error fetching user from Clerk:', error);
    // Continuar com plano free se houver erro
  }

  // 2. Obter limites do plano
  const planLimits = PLAN_LIMITS[userPlan];

  // 3. Verificar se usuário existe no banco
  const { data: existing } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    // 3a. Criar novo usuário com limites do plano
    const { data: newLimit, error } = await supabase
      .from('user_limits')
      .insert([{
        user_id: userId,
        plan_type: userPlan,
        monthly_story_limit: planLimits.monthly_story_limit,
        tokens_limit_monthly: planLimits.tokens_limit_monthly,
        stories_used_this_month: 0,
        tokens_used_this_month: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return newLimit;
  }

  // 4. Verificar se plano mudou
  if (existing.plan_type !== userPlan) {
    console.log(`Plan changed for user ${userId}: ${existing.plan_type} → ${userPlan}`);
    
    // Atualizar limites baseado no novo plano
    const { data: updated, error } = await supabase
      .from('user_limits')
      .update({
        plan_type: userPlan,
        monthly_story_limit: planLimits.monthly_story_limit,
        tokens_limit_monthly: planLimits.tokens_limit_monthly,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  // 5. Verificar reset mensal
  const resetDate = new Date(existing.limit_reset_date);
  const now = new Date();
  
  if (now >= resetDate) {
    const { data: updated, error } = await supabase
      .from('user_limits')
      .update({
        stories_used_this_month: 0,
        tokens_used_this_month: 0,
        limit_reset_date: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  return existing;
}

async function checkUserCanGenerate(userId) {
  const userLimit = await ensureUserLimit(userId);

  if (userLimit.stories_used_this_month >= userLimit.monthly_story_limit) {
    return {
      allowed: false,
      reason: 'story_limit_reached',
      message: `Você atingiu seu limite de ${userLimit.monthly_story_limit} histórias este mês.`,
      current: userLimit.stories_used_this_month,
      limit: userLimit.monthly_story_limit,
      resetDate: userLimit.limit_reset_date
    };
  }

  if (userLimit.tokens_used_this_month >= userLimit.tokens_limit_monthly) {
    return {
      allowed: false,
      reason: 'token_limit_reached',
      message: `Você atingiu seu limite de tokens este mês.`,
      tokensUsed: userLimit.tokens_used_this_month,
      tokensLimit: userLimit.tokens_limit_monthly,
      resetDate: userLimit.limit_reset_date
    };
  }

  return {
    allowed: true,
    userLimit
  };
}

function calculateCost(inputTokens, outputTokens) {
  const pricing = PRICING[MODEL];
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  return inputCost + outputCost;
}

async function callClaude(systemPrompt, userMessage) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  return {
    content: message.content[0].text,
    usage: message.usage
  };
}

// ============================================
// ENDPOINT 1: Sugerir 3 Caminhos
// ============================================
router.post('/suggest-paths', requireAuthentication, async (req, res) => {
  try {
    const { userInput } = req.body;
    const userId = req.auth.userId;
    
    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User input is required' 
      });
    }

    // Verificar limites (NÃO conta como história completa ainda)
    const canGenerate = await checkUserCanGenerate(userId);
    if (!canGenerate.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Limit reached',
        ...canGenerate
      });
    }

    // Detectar idioma
    const language = detectLanguage(userInput);

    // Chamar Claude
    const systemPrompt = getPrompt('suggest_paths');
    const { content, usage } = await callClaude(systemPrompt, userInput);

    // Parse JSON response
    let paths;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      paths = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        raw: content
      });
    }

    const totalTokens = usage.input_tokens + usage.output_tokens;
    const costUsd = calculateCost(usage.input_tokens, usage.output_tokens);

    // Salvar no tracking (mas NÃO incrementar contador de histórias ainda)
    await supabase.from('usage_tracking').insert([{
      user_id: userId,
      prompt_type: 'suggest_paths',
      tokens_used: totalTokens,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd
    }]);

    // Atualizar apenas tokens (não histórias)
    await supabase
      .from('user_limits')
      .update({
        tokens_used_this_month: canGenerate.userLimit.tokens_used_this_month + totalTokens,
        updated_at: new Date()
      })
      .eq('user_id', userId);

    res.json({
      success: true,
      paths: paths.paths,
      metadata: {
        language,
        tokensUsed: totalTokens,
        costUsd: costUsd.toFixed(6)
      }
    });

  } catch (error) {
    console.error('Error in suggest-paths:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ENDPOINT 2: Gerar História Completa
// ============================================
router.post('/generate-story', requireAuthentication, async (req, res) => {
  try {
    const { 
      userInput,           // Input original
      selectedPath,        // Caminho escolhido (ou null)
      customDescription    // Descrição customizada (ou null)
    } = req.body;
    
    const userId = req.auth.userId;
    
    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User input is required' 
      });
    }

    // Verificar limites
    const canGenerate = await checkUserCanGenerate(userId);
    if (!canGenerate.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Limit reached',
        ...canGenerate
      });
    }

    // Construir mensagem para Claude
    let fullPrompt = `INPUT ORIGINAL:\n${userInput}\n\n`;
    
    if (customDescription) {
      fullPrompt += `DIRECIONAMENTO ESCOLHIDO PELO USUÁRIO:\n${customDescription}`;
    } else if (selectedPath) {
      fullPrompt += `CAMINHO ESCOLHIDO:\nTítulo: ${selectedPath.title}\nDescrição: ${selectedPath.description}\nFoco: ${selectedPath.focus}`;
    } else {
      fullPrompt += `INSTRUÇÃO: Crie uma história seguindo o input original.`;
    }

    // Chamar Claude
    const systemPrompt = getPrompt('generate_story');
    const { content, usage } = await callClaude(systemPrompt, fullPrompt);

    // Parse JSON response
    let storyData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      storyData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        raw: content
      });
    }

    const totalTokens = usage.input_tokens + usage.output_tokens;
    const costUsd = calculateCost(usage.input_tokens, usage.output_tokens);

    // Salvar conversa completa
    const { data: conversationData, error: convError } = await supabase
      .from('conversations')
      .insert([{
        user_input: userInput,
        ai_response: JSON.stringify(storyData.story),
        prompt_used: systemPrompt.substring(0, 500), // Truncar para não exceder limite
        prompt_type: 'generate_story',
        user_id: userId,
        tokens_used: totalTokens,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens
      }])
      .select()
      .single();

    if (convError) throw convError;

    // Tracking
    await supabase.from('usage_tracking').insert([{
      user_id: userId,
      prompt_type: 'generate_story',
      tokens_used: totalTokens,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd,
      conversation_id: conversationData.id
    }]);

    // Atualizar contadores (AGORA SIM incrementa histórias)
    await supabase
      .from('user_limits')
      .update({
        stories_used_this_month: canGenerate.userLimit.stories_used_this_month + 1,
        tokens_used_this_month: canGenerate.userLimit.tokens_used_this_month + totalTokens,
        updated_at: new Date()
      })
      .eq('user_id', userId);

    // Buscar limites atualizados
    const updatedLimit = await ensureUserLimit(userId);

    res.json({
      success: true,
      story: storyData.story,
      metadata: storyData.metadata,
      conversationId: conversationData.id,
      usage: {
        tokensUsed: totalTokens,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd: costUsd.toFixed(6),
        storiesRemaining: updatedLimit.monthly_story_limit - updatedLimit.stories_used_this_month,
        tokensRemaining: updatedLimit.tokens_limit_monthly - updatedLimit.tokens_used_this_month
      }
    });

  } catch (error) {
    console.error('Error in generate-story:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ENDPOINT 3: Refinar Linha Específica
// ============================================
router.post('/refine-line', requireAuthentication, async (req, res) => {
  try {
    const { 
      currentStory,      // Objeto com line1, line2, ..., line5
      lineNumber,        // 1-5
      userSuggestion,    // O que o usuário quer mudar
      conversationId     // ID da conversa original
    } = req.body;
    
    const userId = req.auth.userId;
    
    if (!currentStory || !lineNumber || !userSuggestion) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Verificar limites (refinamentos são mais baratos, mas ainda contam)
    const canGenerate = await checkUserCanGenerate(userId);
    if (!canGenerate.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Limit reached',
        ...canGenerate
      });
    }

    // Construir prompt
    const fullPrompt = `
HISTÓRIA ATUAL:
Linha 1: ${currentStory.line1}
Linha 2: ${currentStory.line2}
Linha 3: ${currentStory.line3}
Linha 4: ${currentStory.line4}
Linha 5: ${currentStory.line5}

LINHA A MODIFICAR: ${lineNumber}
SUGESTÃO DO USUÁRIO: ${userSuggestion}
`;

    // Chamar Claude
    const systemPrompt = getPrompt('refine_line');
    const { content, usage } = await callClaude(systemPrompt, fullPrompt);

    // Parse JSON response
    let refinedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      refinedData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        raw: content
      });
    }

    const totalTokens = usage.input_tokens + usage.output_tokens;
    const costUsd = calculateCost(usage.input_tokens, usage.output_tokens);

    // Atualizar conversa existente (adicionar refinamento ao histórico)
    if (conversationId) {
      await supabase
        .from('conversations')
        .update({
          ai_response: JSON.stringify(refinedData.story),
          tokens_used: totalTokens, // Sobrescrever com novo total
          updated_at: new Date()
        })
        .eq('id', conversationId);
    }

    // Tracking
    await supabase.from('usage_tracking').insert([{
      user_id: userId,
      prompt_type: 'refine_line',
      tokens_used: totalTokens,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd,
      conversation_id: conversationId
    }]);

    // Atualizar apenas tokens (refinamento não conta como história nova)
    await supabase
      .from('user_limits')
      .update({
        tokens_used_this_month: canGenerate.userLimit.tokens_used_this_month + totalTokens,
        updated_at: new Date()
      })
      .eq('user_id', userId);

    res.json({
      success: true,
      story: refinedData.story,
      changedLine: refinedData.changed_line,
      explanation: refinedData.explanation,
      usage: {
        tokensUsed: totalTokens,
        costUsd: costUsd.toFixed(6)
      }
    });

  } catch (error) {
    console.error('Error in refine-line:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET - Verificar uso atual do usuário
// ============================================
router.get('/usage', requireAuthentication, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userLimit = await ensureUserLimit(userId);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    res.json({
      success: true,
      usage: {
        planType: userLimit.plan_type,
        stories: {
          used: userLimit.stories_used_this_month,
          limit: userLimit.monthly_story_limit,
          remaining: userLimit.monthly_story_limit - userLimit.stories_used_this_month,
          percentage: Math.round((userLimit.stories_used_this_month / userLimit.monthly_story_limit) * 100)
        },
        tokens: {
          used: userLimit.tokens_used_this_month,
          limit: userLimit.tokens_limit_monthly,
          remaining: userLimit.tokens_limit_monthly - userLimit.tokens_used_this_month,
          percentage: Math.round((userLimit.tokens_used_this_month / userLimit.tokens_limit_monthly) * 100)
        },
        resetDate: userLimit.limit_reset_date,
        history: usageData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// GET - Buscar histórico de histórias
// ============================================
router.get('/history', requireAuthentication, async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
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
