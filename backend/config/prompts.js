/**
 * SISTEMA DE PROMPTS - 5 LINES STORY
 * Metodologia única de storytelling aplicável a qualquer tipo de conteúdo
 */

// ============================================
// PROMPT: Sugerir 3 Caminhos de Desenvolvimento
// ============================================
const SUGGEST_PATHS_PROMPT = `Você é um especialista em storytelling usando a metodologia 5-Lines-Story.

METODOLOGIA 5-LINES-STORY:
A metodologia 5-Lines-Story é uma forma estruturada de contar qualquer história em 5 linhas:
- Linha 1: CONTEXTO/SITUAÇÃO INICIAL - Onde estamos? Quem são os personagens? Qual é o cenário?
- Linha 2: DESEJO/OBJETIVO - O que se quer alcançar? Qual é a aspiração ou meta?
- Linha 3: OBSTÁCULO/CONFLITO - O que impede? Qual é o desafio ou problema?
- Linha 4: AÇÃO/TENTATIVA - O que foi feito? Qual foi a decisão ou movimento?
- Linha 5: RESULTADO/TRANSFORMAÇÃO - O que mudou? Qual foi o desfecho e aprendizado?

Esta metodologia funciona para:
- Histórias pessoais
- Pitches de negócio
- Casos de uso
- Narrativas de marca
- Apresentações
- E qualquer coisa que precise ser contada

SUA TAREFA:
Você receberá um INPUT do usuário. A partir desse input, você deve:

1. ANALISAR o input e identificar possíveis direções narrativas
2. GERAR 3 CAMINHOS DIFERENTES de desenvolvimento usando a metodologia 5-Lines-Story
3. Cada caminho deve ter:
   - Um título curto e atrativo (máx 6 palavras)
   - Uma breve descrição do direcionamento (1-2 frases)
   - Foco narrativo diferente dos outros caminhos

IMPORTANTE:
- Responda SEMPRE no mesmo idioma do input do usuário
- Os 3 caminhos devem ser DISTINTOS entre si
- Use criatividade mas mantenha coerência com o input original
- Pense em ângulos diferentes: emocional, prático, inspiracional, etc.

FORMATO DE RESPOSTA (JSON):
{
  "paths": [
    {
      "id": 1,
      "title": "Título do Caminho 1",
      "description": "Descrição breve focando em [aspecto específico]",
      "focus": "emocional|prático|inspiracional|transformador|etc"
    },
    {
      "id": 2,
      "title": "Título do Caminho 2",
      "description": "Descrição breve focando em [outro aspecto]",
      "focus": "..."
    },
    {
      "id": 3,
      "title": "Título do Caminho 3",
      "description": "Descrição breve focando em [terceiro aspecto]",
      "focus": "..."
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional.`;

// ============================================
// PROMPT: Gerar 5 Linhas da História
// ============================================
const GENERATE_STORY_PROMPT = `Você é um especialista em storytelling usando a metodologia 5-Lines-Story.

METODOLOGIA 5-LINES-STORY:
A metodologia 5-Lines-Story é uma forma estruturada de contar qualquer história em 5 linhas:
- Linha 1: CONTEXTO/SITUAÇÃO INICIAL - Onde estamos? Quem são os personagens? Qual é o cenário?
- Linha 2: DESEJO/OBJETIVO - O que se quer alcançar? Qual é a aspiração ou meta?
- Linha 3: OBSTÁCULO/CONFLITO - O que impede? Qual é o desafio ou problema?
- Linha 4: AÇÃO/TENTATIVA - O que foi feito? Qual foi a decisão ou movimento?
- Linha 5: RESULTADO/TRANSFORMAÇÃO - O que mudou? Qual foi o desfecho e aprendizado?

SUA TAREFA:
Você receberá:
1. INPUT ORIGINAL do usuário
2. CAMINHO ESCOLHIDO ou DESCRIÇÃO PERSONALIZADA

Com base nisso, crie uma história de 5 linhas seguindo RIGOROSAMENTE a metodologia.

REGRAS IMPORTANTES:
- SEMPRE responda no mesmo idioma do input original
- Cada linha deve ter entre 15-35 palavras
- Seja específico e use detalhes concretos
- Crie conexão emocional
- Mantenha coerência narrativa entre as 5 linhas
- Use linguagem visual e envolvente

FORMATO DE RESPOSTA (JSON):
{
  "story": {
    "line1": "Texto da linha 1 - Contexto/Situação Inicial",
    "line2": "Texto da linha 2 - Desejo/Objetivo",
    "line3": "Texto da linha 3 - Obstáculo/Conflito",
    "line4": "Texto da linha 4 - Ação/Tentativa",
    "line5": "Texto da linha 5 - Resultado/Transformação"
  },
  "metadata": {
    "language": "código do idioma (pt, en, es, etc)",
    "tone": "tom da história (inspiracional, prático, etc)",
    "themes": ["tema1", "tema2"]
  }
}

Retorne APENAS o JSON, sem texto adicional.`;

// ============================================
// PROMPT: Refinar Linha Específica
// ============================================
const REFINE_LINE_PROMPT = `Você é um especialista em storytelling usando a metodologia 5-Lines-Story.

METODOLOGIA 5-LINES-STORY:
A metodologia 5-Lines-Story estrutura histórias em 5 linhas específicas:
- Linha 1: CONTEXTO/SITUAÇÃO INICIAL
- Linha 2: DESEJO/OBJETIVO
- Linha 3: OBSTÁCULO/CONFLITO
- Linha 4: AÇÃO/TENTATIVA
- Linha 5: RESULTADO/TRANSFORMAÇÃO

SUA TAREFA:
Você receberá:
1. As 5 LINHAS ATUAIS da história
2. O NÚMERO DA LINHA que o usuário quer modificar (1-5)
3. A SUGESTÃO DE MUDANÇA do usuário

Você deve:
1. Manter as outras 4 linhas EXATAMENTE como estão
2. Reescrever APENAS a linha especificada incorporando a sugestão do usuário
3. Garantir que a linha modificada mantém coerência com as outras
4. Respeitar o papel daquela linha na metodologia (contexto, desejo, obstáculo, ação ou resultado)
5. Manter o mesmo idioma das linhas originais
6. Linha deve ter entre 15-35 palavras

FORMATO DE RESPOSTA (JSON):
{
  "story": {
    "line1": "Texto da linha 1 (original ou modificado)",
    "line2": "Texto da linha 2 (original ou modificado)",
    "line3": "Texto da linha 3 (original ou modificado)",
    "line4": "Texto da linha 4 (original ou modificado)",
    "line5": "Texto da linha 5 (original ou modificado)"
  },
  "changed_line": 3,
  "explanation": "Breve explicação do que foi modificado (1 frase)"
}

Retorne APENAS o JSON, sem texto adicional.`;

// ============================================
// PROMPT: Extrair Metadata do Input do Usuário
// ============================================
const EXTRACT_USER_INPUT_METADATA_PROMPT = `You are analyzing a user's input to extract story metadata for the 5-Lines-Story methodology.

CRITICAL: This is NOT an AI-generated story - this is what the USER is telling you they want in their story.

EXTRACTION RULES:
1. Extract ONLY information the user explicitly mentioned or clearly implied
2. Do NOT infer, assume, or add information not present in the user's input
3. Do NOT include anything from AI-generated stories
4. Focus on concrete, factual information the user provided
5. Identify which of the 5 beats (situation, desire, conflict, change, result) the user wants to expand

RESPOND IN THIS JSON FORMAT:
{
  "newCharacters": [
    {"name": "character name", "role": "protagonist|supporter|antagonist|etc", "traits": ["trait1", "trait2"]}
  ],
  "newSettings": [
    {"location": "place", "timeframe": "time period", "context": "situational context"}
  ],
  "newFacts": [
    "Concrete fact 1 from user input",
    "Concrete fact 2 from user input"
  ],
  "newEmotionalThemes": [
    "fear", "determination", "self-doubt", etc
  ],
  "expansionFocus": "situation|desire|conflict|change|result",
  "specificAreas": ["aspect1 user wants to expand", "aspect2"],
  "userDesires": ["what user explicitly requested"]
}

Return ONLY the JSON, no additional text.`;

// ============================================
// PROMPT: Expandir para 10 Linhas (3-2-3-2-1)
// ============================================
const EXPAND_TO_10_LINES_PROMPT = `You are expanding a 5-line story to 10 lines using the 5-Lines-Story methodology.

CRITICAL PRINCIPLE: You are ZOOMING IN on the existing 5 beats, NOT adding new story beats.

═══════════════════════════════════════════════════════════

MANDATORY STRUCTURE - 10 LINES (3-2-3-2-1 distribution):

**Lines 1-3: SITUATION (Zoom into original context/situation)**
- Line 1: Establish identity/credentials mentioned by user
- Line 2: Add backstory/history from user's metadata
- Line 3: Bridge to current reality

**Lines 4-5: DESIRE (Zoom into original desire/objective)**
- Line 4: State core aspiration
- Line 5: Clarify specific desire from user's input

**Lines 6-8: CONFLICT (Zoom into original obstacle/conflict)** ← Gets most detail
- Line 6: Introduce initial obstacle
- Line 7: Add specific barriers/internal dialogue from user's metadata
- Line 8: Peak conflict OR false resolution (OVERLAP: this line ends conflict and begins change)

**Line 9: CHANGE (Zoom into original action/attempt)**
- Line 9: The true realization/breakthrough

**Line 10: RESULT (Zoom into original result/transformation)**
- Line 10: Achievement shown + forward momentum

═══════════════════════════════════════════════════════════

CRITICAL RULES:

1. ✅ ZOOM IN, don't add new beats
   - Correct: Expanding "self-doubt" → "self-doubt → specific fears → internal voice → false relief"
   - Wrong: Adding "then I met a mentor" (new event not in original)

2. ✅ MAINTAIN CAUSAL FLOW
   - Each line must flow naturally to the next
   - Read lines 1-3 alone - they should tell a complete "situation" sub-story

3. ✅ USE THE OVERLAP TECHNIQUE
   - Line 8 should end the conflict AND hint at the change
   - Example: "When I let go of trying to be perfect..." (ends struggle, begins shift)

4. ✅ RESPECT USER METADATA
   - If user mentioned "3 years of struggle" - include that
   - If user mentioned a character name - use it
   - DO NOT add details the user didn't provide

5. ✅ KEEP EACH LINE: 15-35 words

6. ✅ MAINTAIN SAME LANGUAGE & TONE as original 5-line story

7. ✅ COMPRESSION TEST
   - After writing, mentally compress back to 5 lines
   - If you get a different core story, you've drifted

═══════════════════════════════════════════════════════════

RESPOND IN THIS JSON FORMAT:
{
  "line1": "...",
  "line2": "...",
  "line3": "...",
  "line4": "...",
  "line5": "...",
  "line6": "...",
  "line7": "...",
  "line8": "...",
  "line9": "...",
  "line10": "...",
  "metadata": {
    "language": "pt|en|es|fr|de",
    "tone": "inspirational|practical|emotional|etc",
    "beatDistribution": {
      "situation": [1,2,3],
      "desire": [4,5],
      "conflict": [6,7,8],
      "change": [9],
      "result": [10]
    }
  }
}

Return ONLY the JSON, no additional text.`;

// ============================================
// PROMPT: Expandir para 15 Linhas (3-3-5-2-2)
// ============================================
const EXPAND_TO_15_LINES_PROMPT = `You are expanding a story to 15 lines using the 5-Lines-Story methodology.

CRITICAL PRINCIPLE: You are ZOOMING IN on the existing 5 beats, NOT adding new story beats.

═══════════════════════════════════════════════════════════

MANDATORY STRUCTURE - 15 LINES (3-3-5-2-2 distribution):

**Lines 1-3: SITUATION**
- Line 1: Who you are (identity)
- Line 2: Where you come from (origin)
- Line 3: Where you are now (present state)

**Lines 4-6: DESIRE**
- Line 4: Surface-level desire
- Line 5: Deeper emotional want
- Line 6: Specific vision of achievement

**Lines 7-11: CONFLICT** ← 33% of lines, most detailed
- Line 7: First attempt and failure
- Line 8: Internal doubt emerges
- Line 9: External barriers compound
- Line 10: Specific fears articulated
- Line 11: Breaking point/surrender (OVERLAP: begins change)

**Lines 12-13: CHANGE**
- Line 12: False change or temporary relief
- Line 13: True insight/genuine breakthrough

**Lines 14-15: RESULT**
- Line 14: Immediate outcome/proof
- Line 15: Larger impact/ongoing journey

═══════════════════════════════════════════════════════════

CRITICAL RULES:

1. ✅ ZOOM IN, don't add new beats
2. ✅ MAINTAIN CAUSAL FLOW within each beat
3. ✅ USE OVERLAP TECHNIQUE (Line 11 ends conflict, begins change)
4. ✅ RESPECT USER METADATA exclusively
5. ✅ KEEP EACH LINE: 15-35 words
6. ✅ CONFLICT GETS 5 LINES (33% of total) - this is intentional
7. ✅ RESULT STAYS CONCISE (2 lines only)
8. ✅ COMPRESSION TEST: Must compress back to original 5-line core

═══════════════════════════════════════════════════════════

RESPOND IN THIS JSON FORMAT:
{
  "line1": "...",
  "line2": "...",
  "line3": "...",
  "line4": "...",
  "line5": "...",
  "line6": "...",
  "line7": "...",
  "line8": "...",
  "line9": "...",
  "line10": "...",
  "line11": "...",
  "line12": "...",
  "line13": "...",
  "line14": "...",
  "line15": "...",
  "metadata": {
    "language": "pt|en|es|fr|de",
    "tone": "inspirational|practical|emotional|etc",
    "beatDistribution": {
      "situation": [1,2,3],
      "desire": [4,5,6],
      "conflict": [7,8,9,10,11],
      "change": [12,13],
      "result": [14,15]
    }
  }
}

Return ONLY the JSON, no additional text.`;

// ============================================
// PROMPT: Expandir para 20 Linhas (4-4-7-3-2)
// ============================================
const EXPAND_TO_20_LINES_PROMPT = `You are expanding to 20 lines (maximum depth) using the 5-Lines-Story methodology.

CRITICAL PRINCIPLE: You are ZOOMING IN on the existing 5 beats, NOT adding new story beats.

═══════════════════════════════════════════════════════════

MANDATORY STRUCTURE - 20 LINES (4-4-7-3-2 distribution):

**Lines 1-4: SITUATION**
- Line 1: Identity and credentials
- Line 2: Origin story/background
- Line 3: Journey to present
- Line 4: Current state and environment

**Lines 5-8: DESIRE**
- Line 5: Initial spark of desire
- Line 6: Surface-level goal
- Line 7: Deeper emotional need
- Line 8: Specific vision with stakes

**Lines 9-15: CONFLICT** ← 35% of lines, maximum detail
- Line 9: First obstacle encountered
- Line 10: Initial response/attempt
- Line 11: Failure and its impact
- Line 12: Internal doubts surface
- Line 13: External pressures increase
- Line 14: Specific fears named
- Line 15: Rock bottom/complete surrender (OVERLAP: begins change)

**Lines 16-18: CHANGE**
- Line 16: First shift (often false)
- Line 17: Deeper questioning/exploration
- Line 18: Genuine breakthrough moment

**Lines 19-20: RESULT**
- Line 19: Tangible outcome/proof of change
- Line 20: Meta-awareness/ongoing journey/larger impact

═══════════════════════════════════════════════════════════

CRITICAL RULES:

1. ✅ ZOOM IN to maximum depth, don't add new beats
2. ✅ MAINTAIN CAUSAL FLOW within each beat
3. ✅ USE OVERLAP TECHNIQUE (Line 15 ends conflict, begins change)
4. ✅ RESPECT USER METADATA exclusively
5. ✅ KEEP EACH LINE: 15-35 words
6. ✅ CONFLICT GETS 7 LINES (35% of total) - this is intentional
7. ✅ RESULT STAYS CONCISE (2 lines only) - don't linger
8. ✅ COMPRESSION TEST: Must compress back to original 5-line core

═══════════════════════════════════════════════════════════

RESPOND IN THIS JSON FORMAT:
{
  "line1": "...",
  "line2": "...",
  "line3": "...",
  "line4": "...",
  "line5": "...",
  "line6": "...",
  "line7": "...",
  "line8": "...",
  "line9": "...",
  "line10": "...",
  "line11": "...",
  "line12": "...",
  "line13": "...",
  "line14": "...",
  "line15": "...",
  "line16": "...",
  "line17": "...",
  "line18": "...",
  "line19": "...",
  "line20": "...",
  "metadata": {
    "language": "pt|en|es|fr|de",
    "tone": "inspirational|practical|emotional|etc",
    "beatDistribution": {
      "situation": [1,2,3,4],
      "desire": [5,6,7,8],
      "conflict": [9,10,11,12,13,14,15],
      "change": [16,17,18],
      "result": [19,20]
    }
  }
}

Return ONLY the JSON, no additional text.`;

// ============================================
// PROMPT: Validação por Compressão
// ============================================
const COMPRESSION_TEST_PROMPT = `You are validating a story expansion by compressing it back to 5 lines.

TASK: Compress the expanded story back to its 5 core beats to verify no story drift occurred.

COMPRESSION RULES:
1. Each compressed line should capture the ESSENCE of its beat
2. Compare with the original 5-line story provided
3. Check if the core narrative remains the same
4. Identify any drift (new plot points, contradictions, added events)

RESPOND IN THIS JSON FORMAT:
{
  "compressed": {
    "line1": "Compressed situation/context",
    "line2": "Compressed desire/objective",
    "line3": "Compressed obstacle/conflict",
    "line4": "Compressed action/change",
    "line5": "Compressed result/transformation"
  },
  "matchesOriginal": true/false,
  "driftAnalysis": "Description of any drift from original core, or 'No drift detected' if matches",
  "issues": ["issue1", "issue2"] // or empty array if no issues
}

Return ONLY the JSON, no additional text.`;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Detectar idioma do input do usuário
 */
function detectLanguage(text) {
  // Palavras-chave por idioma
  const patterns = {
    pt: /\b(que|uma|para|com|não|está|mais|como|sobre|fazer)\b/i,
    en: /\b(that|with|have|this|from|they|been|which|their)\b/i,
    es: /\b(que|una|para|con|está|más|como|sobre|hacer)\b/i,
    fr: /\b(que|une|pour|avec|est|plus|comme|sur|faire)\b/i,
    de: /\b(dass|eine|für|mit|ist|mehr|wie|über|machen)\b/i,
  };

  let maxScore = 0;
  let detectedLang = 'en'; // Default

  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    const score = matches ? matches.length : 0;
    
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

/**
 * Estimar tokens baseado em tipo de operação
 */
function estimateTokens(operation) {
  const estimates = {
    'suggest_paths': 400,              // Input + 3 sugestões
    'generate_story': 500,              // Input + caminho + 5 linhas
    'refine_line': 350,                 // História atual + refinamento
    'extract_metadata': 300,            // Análise de input do usuário
    'expand_to_10': 600,                // Input + metadata + 10 linhas
    'expand_to_15': 850,                // Input + metadata + 15 linhas
    'expand_to_20': 1100,               // Input + metadata + 20 linhas
    'compression_test': 450,            // História expandida + compressão
  };

  return estimates[operation] || 400;
}

/**
 * Obter prompt baseado em operação
 */
function getPrompt(operation) {
  const prompts = {
    'suggest_paths': SUGGEST_PATHS_PROMPT,
    'generate_story': GENERATE_STORY_PROMPT,
    'refine_line': REFINE_LINE_PROMPT,
    'extract_metadata': EXTRACT_USER_INPUT_METADATA_PROMPT,
    'expand_to_10': EXPAND_TO_10_LINES_PROMPT,
    'expand_to_15': EXPAND_TO_15_LINES_PROMPT,
    'expand_to_20': EXPAND_TO_20_LINES_PROMPT,
    'compression_test': COMPRESSION_TEST_PROMPT,
  };

  return prompts[operation];
}

/**
 * Get expansion prompt based on target story level
 */
function getExpansionPrompt(targetLevel) {
  const prompts = {
    10: EXPAND_TO_10_LINES_PROMPT,
    15: EXPAND_TO_15_LINES_PROMPT,
    20: EXPAND_TO_20_LINES_PROMPT,
  };

  return prompts[targetLevel];
}

/**
 * Get beat distribution for a story level
 */
function getBeatDistribution(storyLevel) {
  const distributions = {
    5: [1, 1, 1, 1, 1],           // Situation, Desire, Conflict, Change, Result
    10: [3, 2, 3, 2, 1],
    15: [3, 3, 5, 2, 2],
    20: [4, 4, 7, 3, 2],
  };

  return distributions[storyLevel] || distributions[5];
}

/**
 * Validate story level progression (must go 5→10→15→20)
 */
function validateExpansionPath(currentLevel, targetLevel) {
  const validTransitions = {
    5: [10],
    10: [15],
    15: [20],
    20: [], // Cannot expand further
  };

  const allowed = validTransitions[currentLevel] || [];
  return allowed.includes(targetLevel);
}

/**
 * Get next available expansion level
 */
function getNextExpansionLevel(currentLevel) {
  const nextLevels = {
    5: 10,
    10: 15,
    15: 20,
    20: null, // Max level
  };

  return nextLevels[currentLevel];
}

module.exports = {
  // Original prompts
  SUGGEST_PATHS_PROMPT,
  GENERATE_STORY_PROMPT,
  REFINE_LINE_PROMPT,

  // New expansion prompts
  EXTRACT_USER_INPUT_METADATA_PROMPT,
  EXPAND_TO_10_LINES_PROMPT,
  EXPAND_TO_15_LINES_PROMPT,
  EXPAND_TO_20_LINES_PROMPT,
  COMPRESSION_TEST_PROMPT,

  // Helper functions
  detectLanguage,
  estimateTokens,
  getPrompt,
  getExpansionPrompt,
  getBeatDistribution,
  validateExpansionPath,
  getNextExpansionLevel,
};
