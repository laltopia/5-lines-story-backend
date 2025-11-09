const Joi = require('joi');

// ============================================
// VALIDATION SCHEMAS
// ============================================

// User validation schemas
const userSchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .trim()
      .lowercase()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  })
};

// AI/Story validation schemas
const aiSchemas = {
  suggestPaths: Joi.object({
    userInput: Joi.string()
      .min(10)
      .max(50000) // Increased for document support (was 5000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Story idea is required',
        'string.min': 'Story idea must be at least 10 characters long',
        'string.max': 'Story idea cannot exceed 50,000 characters',
        'any.required': 'Story idea is required'
      })
  }),

  generateStory: Joi.object({
    userInput: Joi.string()
      .min(10)
      .max(50000) // Increased for document support (was 5000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Story idea is required',
        'string.min': 'Story idea must be at least 10 characters long',
        'string.max': 'Story idea cannot exceed 50,000 characters',
        'any.required': 'Story idea is required'
      }),
    selectedPath: Joi.object({
      title: Joi.string().max(200).allow(null, ''),
      description: Joi.string().max(1000).allow(null, ''),
      focus: Joi.string().max(500).allow(null, '')
    }).allow(null),
    customDescription: Joi.string()
      .max(1000)
      .allow(null, ''),
    inputType: Joi.string()
      .valid('text', 'audio', 'document')
      .default('text')
      .optional(),
    originalFileInfo: Joi.object({
      fileName: Joi.string().max(255),
      fileSize: Joi.number().integer().positive(),
      mimeType: Joi.string().max(100),
      extractedLength: Joi.number().integer()
    }).allow(null).optional()
  }),

  refineLine: Joi.object({
    currentStory: Joi.object({
      line1: Joi.string().max(5000),
      line2: Joi.string().max(5000),
      line3: Joi.string().max(5000),
      line4: Joi.string().max(5000),
      line5: Joi.string().max(5000),
      // Support for expanded stories (10/15/20 lines)
      line6: Joi.string().max(5000).optional(),
      line7: Joi.string().max(5000).optional(),
      line8: Joi.string().max(5000).optional(),
      line9: Joi.string().max(5000).optional(),
      line10: Joi.string().max(5000).optional(),
      line11: Joi.string().max(5000).optional(),
      line12: Joi.string().max(5000).optional(),
      line13: Joi.string().max(5000).optional(),
      line14: Joi.string().max(5000).optional(),
      line15: Joi.string().max(5000).optional(),
      line16: Joi.string().max(5000).optional(),
      line17: Joi.string().max(5000).optional(),
      line18: Joi.string().max(5000).optional(),
      line19: Joi.string().max(5000).optional(),
      line20: Joi.string().max(5000).optional()
    }).required(),
    lineNumber: Joi.number()
      .integer()
      .min(1)
      .max(20) // Updated to support 20-line stories
      .required()
      .messages({
        'number.base': 'Line number must be a number',
        'number.min': 'Line number must be between 1 and 20',
        'number.max': 'Line number must be between 1 and 20',
        'any.required': 'Line number is required'
      }),
    userSuggestion: Joi.string()
      .min(1)
      .max(5000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Suggestion is required',
        'string.max': 'Suggestion cannot exceed 5000 characters',
        'any.required': 'Suggestion is required'
      }),
    conversationId: Joi.string().uuid().allow(null)
  }),

  // Extract metadata from user input
  extractMetadata: Joi.object({
    userInput: Joi.string()
      .min(10)
      .max(50000)
      .trim()
      .required()
      .messages({
        'string.empty': 'User input is required',
        'string.min': 'User input must be at least 10 characters long',
        'string.max': 'User input cannot exceed 50,000 characters',
        'any.required': 'User input is required'
      }),
    existingMetadata: Joi.object().allow(null).optional(),
    storyLevel: Joi.number()
      .integer()
      .valid(5, 10, 15, 20)
      .default(5)
      .optional(),
    language: Joi.string()
      .valid('pt', 'en', 'es', 'fr', 'de')
      .optional()
  }),

  // Expand story to next level
  expandStory: Joi.object({
    conversationId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'Conversation ID is required',
        'string.guid': 'Invalid conversation ID format',
        'any.required': 'Conversation ID is required'
      }),
    targetLevel: Joi.number()
      .integer()
      .valid(10, 15, 20)
      .required()
      .messages({
        'number.base': 'Target level must be a number',
        'any.only': 'Target level must be 10, 15, or 20',
        'any.required': 'Target level is required'
      }),
    userInput: Joi.string()
      .min(10)
      .max(50000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Expansion guidance is required',
        'string.min': 'Expansion guidance must be at least 10 characters long',
        'string.max': 'Expansion guidance cannot exceed 50,000 characters',
        'any.required': 'Expansion guidance is required'
      }),
    inputType: Joi.string()
      .valid('text', 'audio', 'document')
      .default('text')
      .optional(),
    originalFileInfo: Joi.object({
      fileName: Joi.string().max(255),
      fileSize: Joi.number().integer().positive(),
      mimeType: Joi.string().max(100),
      extractedLength: Joi.number().integer(),
      duration: Joi.number().optional()
    }).allow(null).optional()
  })
};

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

/**
 * Creates validation middleware for a given schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize string to prevent prompt injection
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeForAI(input) {
  if (typeof input !== 'string') return input;

  // Remove or escape potential prompt injection patterns
  return input
    .replace(/\{\{.*?\}\}/g, '') // Remove template-like syntax
    .replace(/<<<.*?>>>/g, '') // Remove special markers
    .replace(/<\|.*?\|>/g, '') // Remove special tokens
    .trim();
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  validate,
  userSchemas,
  aiSchemas,
  sanitizeForAI
};
