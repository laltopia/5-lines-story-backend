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
      .max(5000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Story idea is required',
        'string.min': 'Story idea must be at least 10 characters long',
        'string.max': 'Story idea cannot exceed 5000 characters',
        'any.required': 'Story idea is required'
      })
  }),

  generateStory: Joi.object({
    userInput: Joi.string()
      .min(10)
      .max(5000)
      .trim()
      .required()
      .messages({
        'string.empty': 'Story idea is required',
        'string.min': 'Story idea must be at least 10 characters long',
        'string.max': 'Story idea cannot exceed 5000 characters',
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
      line5: Joi.string().max(5000)
    }).required(),
    lineNumber: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.base': 'Line number must be a number',
        'number.min': 'Line number must be between 1 and 5',
        'number.max': 'Line number must be between 1 and 5',
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
