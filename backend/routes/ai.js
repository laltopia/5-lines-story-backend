const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const supabase = require('../config/supabase');
const { requireAuthentication } = require('../middleware/auth');
const { validate, aiSchemas, sanitizeForAI } = require('../utils/validation');
const {
  getPrompt,
  detectLanguage,
  estimateTokens
} = require('../config/prompts');

// Document parsing libraries
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Initialize OpenAI client for Whisper API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = 'claude-sonnet-4-20250514';

// Configuração de preços
const PRICING = {
  [MODEL]: {
    input: 3.00 / 1_000_000,
    output: 15.00 / 1_000_000
  }
};

// ============================================
// 🔥 SEM LIMITES - MODO TESTE TOTAL
// ============================================

// ============================================
// HELPERS SIMPLIFICADOS
// ============================================

async function ensureUserTracking(userId) {
  const { data: existing } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    const { data: newUser, error } = await supabase
      .from('user_limits')
      .insert([{
        user_id: userId,
        plan_type: 'unlimited',
        monthly_story_limit: 999999,
        tokens_limit_monthly: 999999999,
        stories_used_this_month: 0,
        tokens_used_this_month: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return newUser;
  }

  return existing;
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

async function updateTokenUsage(userId, tokensToAdd) {
  const { data: current } = await supabase
    .from('user_limits')
    .select('tokens_used_this_month')
    .eq('user_id', userId)
    .single();

  if (!current) return;

  await supabase
    .from('user_limits')
    .update({
      tokens_used_this_month: current.tokens_used_this_month + tokensToAdd,
      updated_at: new Date()
    })
    .eq('user_id', userId);
}

async function incrementStoryCount(userId) {
  const { data: current } = await supabase
    .from('user_limits')
    .select('stories_used_this_month')
    .eq('user_id', userId)
    .single();

  if (!current) return;

  await supabase
    .from('user_limits')
    .update({
      stories_used_this_month: current.stories_used_this_month + 1,
      updated_at: new Date()
    })
    .eq('user_id', userId);
}

// ============================================
// ENDPOINT 1: Sugerir 3 Caminhos (PROTECTED + VALIDATED)
// ============================================
router.post('/suggest-paths', requireAuthentication, validate(aiSchemas.suggestPaths), async (req, res) => {
  try {
    const { userInput } = req.body;
    const userId = req.auth.userId;

    // Sanitize input to prevent prompt injection
    const sanitizedInput = sanitizeForAI(userInput);

    await ensureUserTracking(userId);

    const language = detectLanguage(sanitizedInput);

    const systemPrompt = getPrompt('suggest_paths');
    const { content, usage } = await callClaude(systemPrompt, sanitizedInput);

    let paths;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      paths = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process AI response. Please try again.'
      });
    }

    const totalTokens = usage.input_tokens + usage.output_tokens;
    const costUsd = calculateCost(usage.input_tokens, usage.output_tokens);

    await supabase.from('usage_tracking').insert([{
      user_id: userId,
      prompt_type: 'suggest_paths',
      tokens_used: totalTokens,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd
    }]);

    await updateTokenUsage(userId, totalTokens);

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
      error: 'Failed to generate story paths. Please try again later.'
    });
  }
});

// ============================================
// ENDPOINT 2: Gerar História Completa (PROTECTED + VALIDATED)
// ============================================
router.post('/generate-story', requireAuthentication, validate(aiSchemas.generateStory), async (req, res) => {
  try {
    const {
      userInput,
      selectedPath,
      customDescription,
      inputType,
      originalFileInfo
    } = req.body;

    const userId = req.auth.userId;

    // Sanitize all user inputs to prevent prompt injection
    const sanitizedInput = sanitizeForAI(userInput);
    const sanitizedCustomDesc = customDescription ? sanitizeForAI(customDescription) : null;

    await ensureUserTracking(userId);

    let fullPrompt = `INPUT ORIGINAL:\n${sanitizedInput}\n\n`;

    if (sanitizedCustomDesc) {
      fullPrompt += `DIRECIONAMENTO ESCOLHIDO PELO USUÁRIO:\n${sanitizedCustomDesc}`;
    } else if (selectedPath) {
      // Sanitize path fields too
      const sanitizedPath = {
        title: sanitizeForAI(selectedPath.title || ''),
        description: sanitizeForAI(selectedPath.description || ''),
        focus: sanitizeForAI(selectedPath.focus || '')
      };
      fullPrompt += `CAMINHO ESCOLHIDO:\nTítulo: ${sanitizedPath.title}\nDescrição: ${sanitizedPath.description}\nFoco: ${sanitizedPath.focus}`;
    } else {
      fullPrompt += `INSTRUÇÃO: Crie uma história seguindo o input original.`;
    }

    const systemPrompt = getPrompt('generate_story');
    const { content, usage } = await callClaude(systemPrompt, fullPrompt);

    let storyData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      storyData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process AI response. Please try again.'
      });
    }

    const totalTokens = usage.input_tokens + usage.output_tokens;
    const costUsd = calculateCost(usage.input_tokens, usage.output_tokens);

    // Extract title from selectedPath or use custom description or generate from userInput
    let storyTitle = null;
    if (selectedPath && selectedPath.title) {
      storyTitle = selectedPath.title;
    } else if (customDescription) {
      // Use first 100 chars of custom description as title
      storyTitle = customDescription.substring(0, 100);
    } else {
      // Use first 100 chars of user input as title
      storyTitle = userInput.substring(0, 100);
    }

    const { data: conversationData, error: convError } = await supabase
      .from('conversations')
      .insert([{
        user_input: userInput,
        ai_response: JSON.stringify(storyData.story),
        title: storyTitle,
        prompt_used: systemPrompt.substring(0, 500),
        prompt_type: 'generate_story',
        user_id: userId,
        tokens_used: totalTokens,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        input_type: inputType || 'text',
        original_file_info: originalFileInfo || null
      }])
      .select()
      .single();

    if (convError) throw convError;

    // Prepare metadata for usage tracking
    const usageMetadata = originalFileInfo ? {
      input_type: inputType,
      file_name: originalFileInfo.fileName,
      file_size: originalFileInfo.fileSize,
      mime_type: originalFileInfo.mimeType,
      extracted_length: originalFileInfo.extractedLength
    } : null;

    await supabase.from('usage_tracking').insert([{
      user_id: userId,
      prompt_type: 'generate_story',
      tokens_used: totalTokens,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd,
      conversation_id: conversationData.id,
      metadata: usageMetadata
    }]);

    await incrementStoryCount(userId);
    await updateTokenUsage(userId, totalTokens);

    res.json({
      success: true,
      story: storyData.story,
      metadata: storyData.metadata,
      conversationId: conversationData.id,
      usage: {
        tokensUsed: totalTokens,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd: costUsd.toFixed(6)
      }
    });

  } catch (error) {
    console.error('Error in generate-story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate story. Please try again later.'
    });
  }
});

// ============================================
// ENDPOINT 3: Refinar Linha Específica (PROTECTED + VALIDATED)
// ============================================
router.post('/refine-line', requireAuthentication, validate(aiSchemas.refineLine), async (req, res) => {
  try {
    const {
      currentStory,
      lineNumber,
      userSuggestion,
      conversationId
    } = req.body;

    const userId = req.auth.userId;

    await ensureUserTracking(userId);

    // Sanitize all story lines and user suggestion to prevent prompt injection
    const sanitizedStory = {
      line1: sanitizeForAI(currentStory.line1 || ''),
      line2: sanitizeForAI(currentStory.line2 || ''),
      line3: sanitizeForAI(currentStory.line3 || ''),
      line4: sanitizeForAI(currentStory.line4 || ''),
      line5: sanitizeForAI(currentStory.line5 || '')
    };
    const sanitizedSuggestion = sanitizeForAI(userSuggestion);

    const fullPrompt = `
HISTÓRIA ATUAL:
Linha 1: ${sanitizedStory.line1}
Linha 2: ${sanitizedStory.line2}
Linha 3: ${sanitizedStory.line3}
Linha 4: ${sanitizedStory.line4}
Linha 5: ${sanitizedStory.line5}

LINHA A MODIFICAR: ${lineNumber}
SUGESTÃO DO USUÁRIO: ${sanitizedSuggestion}
`;

    const systemPrompt = getPrompt('refine_line');
    const { content, usage } = await callClaude(systemPrompt, fullPrompt);

    let refinedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      refinedData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process AI response. Please try again.'
      });
    }

    const totalTokens = usage.input_tokens + usage.output_tokens;
    const costUsd = calculateCost(usage.input_tokens, usage.output_tokens);

    if (conversationId) {
      await supabase
        .from('conversations')
        .update({
          ai_response: JSON.stringify(refinedData.story),
          tokens_used: totalTokens,
          updated_at: new Date()
        })
        .eq('id', conversationId);
    }

    await supabase.from('usage_tracking').insert([{
      user_id: userId,
      prompt_type: 'refine_line',
      tokens_used: totalTokens,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd,
      conversation_id: conversationId
    }]);

    await updateTokenUsage(userId, totalTokens);

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
      error: 'Failed to refine story line. Please try again later.'
    });
  }
});

// ============================================
// GET - Verificar uso atual
// ============================================
router.get('/usage', requireAuthentication, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userLimit = await ensureUserTracking(userId);

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
        planType: 'unlimited',
        stories: {
          used: userLimit.stories_used_this_month,
          limit: 999999,
          remaining: 999999,
          percentage: 0
        },
        tokens: {
          used: userLimit.tokens_used_this_month,
          limit: 999999999,
          remaining: 999999999,
          percentage: 0
        },
        resetDate: userLimit.limit_reset_date,
        history: usageData
      }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage data. Please try again later.'
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
      .limit(50); // Aumentar para 50 histórias

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      conversations: data
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch story history. Please try again later.'
    });
  }
});

// ============================================
// DELETE - Deletar história específica
// ============================================
router.delete('/history/:id', requireAuthentication, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const storyId = req.params.id;
    
    // Verificar se a história pertence ao usuário
    const { data: story } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', storyId)
      .single();
    
    if (!story || story.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this story'
      });
    }
    
    // Deletar história
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', storyId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete story. Please try again later.'
    });
  }
});

// ============================================
// PATCH - Update story (title or content)
// ============================================
router.patch('/update-story/:id', requireAuthentication, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const storyId = req.params.id;
    const { title, ai_response } = req.body;

    // Verificar se a história pertence ao usuário
    const { data: story, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (fetchError) throw fetchError;

    if (!story || story.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this story'
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
    }
    if (ai_response !== undefined) {
      // Validate it's valid JSON
      try {
        JSON.parse(ai_response);
        updateData.ai_response = ai_response;
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid story data format'
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided'
      });
    }

    // Update story
    const { data: updatedStory, error: updateError } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', storyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      // Check if error is due to missing column
      if (updateError.message && updateError.message.includes('column') && updateError.message.includes('title')) {
        return res.status(500).json({
          success: false,
          error: 'Database schema outdated. Please add "title" column to conversations table.',
          details: updateError.message
        });
      }
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Story updated successfully',
      story: updatedStory
    });
  } catch (error) {
    console.error('Error updating story:', error);
    console.error('Error details:', error.message);
    console.error('Update data was:', updateData);
    res.status(500).json({
      success: false,
      error: 'Failed to update story. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// DOCUMENT TEXT EXTRACTION
// ============================================

// Configure multer for document uploads
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain' // TXT
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT'), false);
    }
  }
});

// Extract text from uploaded document
router.post('/extract-text',
  requireAuthentication,
  documentUpload.single('document'),
  async (req, res) => {
    try {
      const userId = req.auth.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document uploaded'
        });
      }

      let extractedText = '';
      const fileBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;
      const fileName = req.file.originalname;

      console.log(`Extracting text from ${fileName} (${mimeType}, ${req.file.size} bytes)`);

      // Extract text based on file type
      if (mimeType === 'application/pdf') {
        // PDF extraction
        try {
          const pdfData = await pdfParse(fileBuffer);
          extractedText = pdfData.text;
          console.log(`PDF extraction successful: ${extractedText.length} characters`);
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          return res.status(400).json({
            success: false,
            error: 'Failed to parse PDF. The file may be corrupted or password-protected.'
          });
        }
      }
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX extraction
        try {
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = result.value;
          console.log(`DOCX extraction successful: ${extractedText.length} characters`);
        } catch (docxError) {
          console.error('DOCX parsing error:', docxError);
          return res.status(400).json({
            success: false,
            error: 'Failed to parse DOCX. The file may be corrupted.'
          });
        }
      }
      else if (mimeType === 'text/plain') {
        // Plain text
        extractedText = fileBuffer.toString('utf-8');
        console.log(`TXT extraction successful: ${extractedText.length} characters`);
      }
      else {
        // Fallback for DOC (older format) - best effort
        try {
          extractedText = fileBuffer.toString('utf-8');
          console.log(`Fallback text extraction: ${extractedText.length} characters`);
        } catch (fallbackError) {
          return res.status(400).json({
            success: false,
            error: 'Failed to extract text from document. Please try a different format.'
          });
        }
      }

      // Clean up extracted text
      extractedText = extractedText
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .replace(/\s{2,}/g, ' '); // Remove excessive spaces

      // Check if extraction was successful
      if (!extractedText || extractedText.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract text from document. File may be empty, corrupted, or contain only images.'
        });
      }

      // Limit text length (Claude has token limits)
      const maxLength = 50000; // ~12,500 tokens
      let wasTruncated = false;
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength);
        wasTruncated = true;
      }

      // Track document extraction usage
      await supabase.from('usage_tracking').insert([{
        user_id: userId,
        prompt_type: 'document_extraction',
        tokens_used: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0, // Free
        conversation_id: null,
        metadata: {
          file_name: fileName,
          file_size: req.file.size,
          mime_type: mimeType,
          extracted_length: extractedText.length,
          was_truncated: wasTruncated
        }
      }]);

      console.log(`Successfully extracted ${extractedText.length} characters from ${fileName}`);

      res.json({
        success: true,
        text: extractedText,
        metadata: {
          fileName: fileName,
          fileSize: req.file.size,
          mimeType: mimeType,
          extractedLength: extractedText.length,
          wasTruncated: wasTruncated
        }
      });

    } catch (error) {
      console.error('Text extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract text from document. Please try again.'
      });
    }
  }
);

// ============================================
// AUDIO TRANSCRIPTION
// ============================================

// Configure multer for audio uploads
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB max (Whisper API limit)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a'
    ];

    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(webm|mp3|wav|m4a|mpeg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio type. Please upload WEBM, MP3, WAV, or M4A'), false);
    }
  }
});

// Transcribe audio using OpenAI Whisper API
router.post('/transcribe-audio',
  requireAuthentication,
  audioUpload.single('audio'),
  async (req, res) => {
    try {
      const userId = req.auth.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file uploaded'
        });
      }

      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const mimeType = req.file.mimetype;

      console.log(`Transcribing audio: ${fileName} (${mimeType}, ${fileSize} bytes)`);

      // Create a File-like object for OpenAI API
      const audioFile = new File([req.file.buffer], fileName, { type: mimeType });

      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'pt', // Portuguese - can be auto-detected or specified
        response_format: 'verbose_json' // Get more metadata
      });

      const transcribedText = transcription.text.trim();

      console.log(`Transcription successful: ${transcribedText.length} characters`);

      // Estimate audio duration (rough estimate from file size)
      // Average: ~1MB per minute for typical audio
      const estimatedDuration = Math.round(fileSize / (1024 * 1024) * 60);

      // Limit transcription length
      let finalText = transcribedText;
      const maxLength = 50000;
      let wasTruncated = false;
      if (finalText.length > maxLength) {
        finalText = finalText.substring(0, maxLength);
        wasTruncated = true;
      }

      // Track audio transcription usage
      await supabase.from('usage_tracking').insert([{
        user_id: userId,
        prompt_type: 'audio_transcription',
        tokens_used: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0.006 * (estimatedDuration / 60), // $0.006 per minute
        conversation_id: null,
        metadata: {
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          transcribed_length: finalText.length,
          estimated_duration: estimatedDuration,
          was_truncated: wasTruncated,
          whisper_duration: transcription.duration || estimatedDuration
        }
      }]);

      console.log(`Successfully transcribed ${finalText.length} characters from ${fileName}`);

      res.json({
        success: true,
        text: finalText,
        metadata: {
          fileName: fileName,
          fileSize: fileSize,
          mimeType: mimeType,
          transcribedLength: finalText.length,
          duration: transcription.duration || estimatedDuration,
          wasTruncated: wasTruncated
        }
      });

    } catch (error) {
      console.error('Audio transcription error:', error);

      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        return res.status(503).json({
          success: false,
          error: 'Transcription service temporarily unavailable. Please try again later.'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to transcribe audio. Please try again.'
      });
    }
  }
);

module.exports = router;
