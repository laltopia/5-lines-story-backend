# StoryMaking.AI

**Transform ideas into compelling 5-line stories with AI assistance.**

[![Production Ready](https://img.shields.io/badge/status-production--ready-green)](https://www.storymaking.ai)
[![Version](https://img.shields.io/badge/version-9.1.0-blue)](https://github.com/laltopia/5-lines-story-backend)
[![License](https://img.shields.io/badge/license-proprietary-red)]()

**Live Site:** [www.storymaking.ai](https://www.storymaking.ai)

---

## 📋 Table of Contents

1. [Application Overview](#-application-overview)
2. [Quick Start](#-quick-start)
3. [Architecture Summary](#-architecture-summary)
4. [Backend Resume](#-backend-resume)
5. [Middleware Resume](#-middleware-resume)
6. [Frontend Resume](#-frontend-resume)
7. [Database Resume](#-database-resume)
8. [API Endpoints](#-api-endpoints)
9. [Security](#-security)
10. [Deployment](#-deployment)
11. [Documentation](#-documentation)

---

## 🎯 Application Overview

### What is StoryMaking.AI?

StoryMaking.AI is a full-stack web application that leverages Claude AI (Anthropic) to help users transform ideas into compelling structured 5-line stories. The application follows the "5-Lines-Story" methodology, a universal storytelling framework that works for personal narratives, business pitches, brand stories, and presentations.

### The 5-Lines-Story Methodology

- **Line 1:** CONTEXT/SITUATION - Setting and characters
- **Line 2:** DESIRE/OBJECTIVE - Goal and aspiration
- **Line 3:** OBSTACLE/CONFLICT - Challenge and problem
- **Line 4:** ACTION/ATTEMPT - Decision and movement
- **Line 5:** RESULT/TRANSFORMATION - Outcome and learning

### Core Features

- 🎨 **AI-Powered Story Paths** - Get 3 narrative direction suggestions for any story idea
- 📖 **5-Line Story Generation** - Create complete structured stories in seconds
- ✍️ **Line-by-Line Refinement** - Edit and improve individual lines with AI assistance
- 📈 **Story Expansion** - Progressive expansion from 5→10→15→20 lines
- 💾 **Story History** - Save, organize, search, and manage all your stories
- 🎙️ **Audio/Document Processing** - Extract text from audio files and documents for story input
- 📤 **Story Sharing** - Share stories via social media
- 📊 **Usage Tracking** - Monitor token usage and associated costs
- 🔐 **Secure Authentication** - Clerk-based user authentication with JWT
- 🎨 **Beautiful UI** - Minimalistic purple design system with flat icons

### User Flow

1. User enters a story idea (text, audio, or document)
2. AI generates 3 narrative path suggestions
3. User selects or customizes a path
4. AI generates a complete 5-line story
5. User can refine individual lines with AI assistance
6. User can expand story to 10/15/20 lines
7. Story is saved to history with automatic title
8. User can view, edit, share, or delete stories

### Key Metrics

- **Total Codebase:** 178,309 lines of code
- **Backend:** Node.js + Express (2,000+ lines)
- **Frontend:** Vanilla JavaScript (4,700+ lines)
- **Design System:** 11,260 lines of custom CSS
- **Average Story Cost:** ~$0.015 (1.5 cents per complete story)
- **Response Time:** <3 seconds for story generation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Supabase** account and project
- **Clerk** account and application
- **Anthropic** API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/laltopia/5-lines-story-backend.git
   cd 5-lines-story-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file with:
   ```bash
   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Supabase Database
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=eyJhbGc...

   # Anthropic AI
   ANTHROPIC_API_KEY=sk-ant-...

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Run database migrations:**
   - Open Supabase SQL Editor
   - Execute all files in `/database/` directory (see `database/README.md`)

5. **Start the development server:**
   ```bash
   npm start
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 🏛️ Architecture Summary

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), SVG Icons |
| **Backend** | Node.js v18+, Express.js v4.18.2 |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Clerk (JWT-based) |
| **AI Engine** | Anthropic Claude Sonnet 4 |
| **File Processing** | Mammoth (DOCX), pdf-parse (PDF), OpenAI Whisper (Audio) |
| **Security** | Helmet, CORS, express-rate-limit, Joi validation |
| **Monitoring** | Sentry (error tracking), PostHog (analytics) |
| **Hosting** | Render.com |
| **Build Tools** | Terser (JS minification), clean-css-cli (CSS minification) |

### Project Structure

```
5-lines-story-backend/
├── backend/                    # Node.js backend server
│   ├── config/                 # Configuration files
│   ├── middleware/             # Express middleware
│   ├── routes/                 # API route handlers
│   ├── utils/                  # Utility functions
│   ├── server.js               # Main Express app
│   └── instrument.js           # Sentry initialization
│
├── public/                     # Frontend static files
│   ├── index.html              # Landing page
│   ├── ai.html                 # Story creation interface
│   ├── history.html            # Story history page
│   ├── *.js                    # Frontend JavaScript
│   ├── *.css                   # Stylesheets
│   └── icons.html              # SVG icon library
│
├── database/                   # Database migrations
│   ├── *.sql                   # Migration scripts
│   └── README.md               # Migration guide
│
├── scripts/                    # Utility scripts
│   └── test-expansion.js       # Test story expansion feature
│
├── LAUNCH_RECOMMENDATIONS.md   # Comprehensive launch guide (60+ items)
├── PRODUCTION_READY.md         # Production readiness checklist
├── AUDIO_DOCUMENT_IMPLEMENTATION.md  # Audio/document feature docs
├── SUPABASE_SCHEMA_IMPROVEMENTS.md   # Database schema documentation
├── SENTRY_SETUP.md             # Error monitoring setup
├── POSTHOG_SETUP.md            # Analytics setup
├── IMPROVEMENTS_SUMMARY.md     # Recent improvements summary
├── TESTING_GUIDE.md            # Manual testing guide
├── PERFORMANCE_OPTIMIZATION.md # Performance optimization tips
├── MOBILE_ANALYSIS.md          # Mobile responsiveness analysis
├── package.json                # NPM dependencies
├── .env.example                # Environment variables template
└── README.md                   # This file
```

---

## ⚙️ Backend Resume

### Overview

The backend is a Node.js + Express.js server that handles authentication, AI interactions, database operations, and file processing. It's built with security-first principles, featuring rate limiting, input validation, and comprehensive error handling.

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `backend/server.js` | 216 | Main Express application with security middleware |
| `backend/routes/ai.js` | 1,538 | AI endpoints for story generation and management |
| `backend/routes/users.js` | 83 | User management endpoints |
| `backend/config/prompts.js` | 21KB | AI prompt templates in Portuguese |
| `backend/config/supabase.js` | 189 bytes | Database client initialization |
| `backend/utils/validation.js` | 7.9KB | Input validation schemas with Joi |
| `backend/middleware/auth.js` | 741 bytes | Clerk authentication middleware |
| `backend/instrument.js` | 52 | Sentry error monitoring initialization |

### Core Functionality

#### 1. AI Story Generation (`backend/routes/ai.js`)
- **Suggest Paths:** Generates 3 narrative direction suggestions
- **Generate Story:** Creates complete 5/10/15/20-line stories
- **Refine Line:** Edits individual story lines
- **Expand Story:** Progressively expands stories (5→10→15→20 lines)
- **Token Tracking:** Records input/output tokens and calculates costs

#### 2. User Management (`backend/routes/users.js`)
- User creation and retrieval
- Plan tracking (free/pro/unlimited)
- Usage limits management

#### 3. File Processing
- **Audio Transcription:** OpenAI Whisper API for voice input
- **PDF Parsing:** Extracts text from PDF documents
- **DOCX Parsing:** Extracts text from Word documents

#### 4. Security Layer (`backend/server.js`)
- **Helmet:** Security headers (CSP, X-Frame-Options, HSTS, etc.)
- **CORS:** Cross-origin protection with whitelist
- **Rate Limiting:**
  - General API: 100 requests / 15 minutes per IP
  - AI endpoints: 30 requests / 15 minutes per IP
- **Input Sanitization:** Prevents prompt injection attacks
- **JWT Validation:** Clerk-based authentication on protected routes

#### 5. Error Monitoring
- **Sentry Integration:** Automatic error tracking and reporting
- **Request Tracing:** Performance monitoring
- **Environment-based Sampling:** 100% in development, 10% in production

### Dependencies

```json
{
  "express": "^4.18.2",
  "helmet": "^8.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^8.2.1",
  "@anthropic-ai/sdk": "^0.27.0",
  "@supabase/supabase-js": "^2.39.0",
  "@clerk/clerk-sdk-node": "^5.0.0",
  "@clerk/express": "^1.4.2",
  "@sentry/node": "^10.23.0",
  "joi": "^18.0.1",
  "openai": "^6.8.1",
  "mammoth": "^1.11.0",
  "pdf-parse": "^2.4.5"
}
```

### API Design Principles

1. **RESTful routes** - Standard HTTP methods (GET, POST, PATCH, DELETE)
2. **JSON responses** - Consistent response format with error codes
3. **Authentication-first** - Protected routes require valid JWT
4. **Rate-limited** - Prevents abuse and controls costs
5. **Validated inputs** - All inputs sanitized and validated with Joi schemas
6. **Async/await** - Modern promise-based error handling

---

## 🔐 Middleware Resume

### Overview

The middleware layer handles cross-cutting concerns like authentication, security headers, rate limiting, and request validation. All middleware is configured in `backend/server.js` and `backend/middleware/auth.js`.

### Middleware Stack (Applied in Order)

#### 1. Sentry Request Handler
```javascript
Sentry.Handlers.requestHandler()
```
- Captures request context for error tracking
- Attaches user information to error reports
- Enables distributed tracing

#### 2. Helmet Security Headers
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.clerk.com"],
      connectSrc: ["'self'", "https://api.anthropic.com"],
      // ... additional CSP directives
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000 }
})
```
- **CSP:** Prevents XSS attacks by controlling resource loading
- **HSTS:** Enforces HTTPS connections
- **X-Frame-Options:** Prevents clickjacking
- **X-Content-Type-Options:** Prevents MIME sniffing

#### 3. CORS Protection
```javascript
cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```
- Whitelists specific origins (localhost in dev, domain in production)
- Allows credentials for authentication cookies
- Restricts HTTP methods and headers

#### 4. Body Parsers
```javascript
express.json({ limit: '10mb' })
express.urlencoded({ extended: true, limit: '10mb' })
```
- Parses JSON request bodies (up to 10MB for audio/document uploads)
- Handles URL-encoded forms

#### 5. Rate Limiting

**General API Rate Limiter:**
```javascript
rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests from this IP'
})
```

**AI Endpoint Rate Limiter:**
```javascript
rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,                    // 30 requests per window
  message: 'Too many AI requests from this IP'
})
```
- Prevents API abuse
- Controls AI costs
- IP-based tracking

#### 6. Clerk Authentication Middleware (`backend/middleware/auth.js`)

**requireAuthentication:**
```javascript
async function requireAuthentication(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  // Verify JWT with Clerk
  const session = await clerkClient.verifyToken(token);
  req.userId = session.userId;
  next();
}
```
- Validates JWT tokens from Clerk
- Extracts user ID and attaches to request
- Returns 401 for invalid/expired tokens

**Removed Middleware:**
- `requirePremium` - Removed to give all users full access (no paywall)

#### 7. Static File Serving
```javascript
express.static('public')
```
- Serves frontend files (HTML, CSS, JS, images)
- Automatic index.html routing

#### 8. Sentry Error Handler
```javascript
Sentry.Handlers.errorHandler()
```
- Captures unhandled errors
- Sends error reports to Sentry
- Must be placed before final error handler

#### 9. Global Error Handler
```javascript
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
})
```
- Catches all errors not handled by routes
- Returns consistent error response
- Logs errors for debugging

### Middleware Best Practices

1. **Order matters** - Middleware is applied sequentially
2. **Security first** - Security middleware before business logic
3. **Rate limit AI** - Separate rate limits for expensive operations
4. **Validate early** - Input validation before database queries
5. **Fail securely** - Default deny for authentication failures

---

## 🎨 Frontend Resume

### Overview

The frontend is built with vanilla HTML5, CSS3, and JavaScript (ES6+) - no frameworks. This approach ensures fast load times, minimal dependencies, and full control over the user experience. The UI follows a minimalistic purple design system with flat icons.

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `public/index.html` | 939 | Landing page with features and CTA |
| `public/ai.html` | 1,294 | Story creation interface |
| `public/ai.js` | 1,433 | Story creation logic and AI interactions |
| `public/history.html` | 825 | Story history and management |
| `public/history.js` | 1,078 | History page logic |
| `public/app.js` | 93 | Common utilities (API calls, auth checks) |
| `public/audio-recorder.js` | 305 | Audio recording functionality |
| `public/file-uploader.js` | 181 | File upload handler |
| `public/design-system.css` | 11,260 | Complete design system |
| `public/styles.css` | 2,777 | Legacy styles (being phased out) |
| `public/icons.html` | 212 | SVG icon library |
| `public/pricing.html` | 946 | Pricing page |
| `public/privacy.html` | 462 | Privacy policy |
| `public/terms.html` | 305 | Terms of service |

### Frontend Architecture

#### 1. Story Creation Flow (`public/ai.html` + `public/ai.js`)

**Step 1: Input Collection**
- Text input (textarea with validation)
- Audio recording (using Web Audio API)
- Document upload (PDF, DOCX)
- 10-character minimum requirement

**Step 2: Path Suggestion**
- API call to `/api/ai/suggest-paths`
- Displays 3 AI-generated narrative directions
- Option to select or customize path
- Loading animation during AI generation

**Step 3: Story Generation**
- API call to `/api/ai/generate-story`
- Renders 5-line story with editable lines
- Token usage display
- Auto-save to history

**Step 4: Line Refinement**
- Click any line to edit
- API call to `/api/ai/refine-line`
- Updates specific line while preserving story context
- Real-time validation

**Step 5: Story Expansion**
- Expand button for 10/15/20-line versions
- API call to `/api/ai/expand-story`
- Progressive expansion with context preservation
- Metadata tracking across expansion levels

#### 2. History Management (`public/history.html` + `public/history.js`)

**Features:**
- Load all user stories (limit: 50 most recent)
- Search/filter by title or content
- Edit story titles inline
- Delete stories with confirmation
- Share stories via social media
- Expand story modal with full content
- Token usage statistics

**UI Components:**
- Story cards with hover effects
- Modal dialogs for story viewing
- Search bar with real-time filtering
- Delete confirmation prompts
- Empty state for new users

#### 3. Audio Recording (`public/audio-recorder.js`)

**Capabilities:**
- Browser-based audio recording (MediaRecorder API)
- WAV/WebM format support
- Real-time recording indicator
- Audio playback preview
- Automatic upload to backend
- Transcription via OpenAI Whisper

**Browser Compatibility:**
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Supported

#### 4. File Upload (`public/file-uploader.js`)

**Supported Formats:**
- PDF documents
- DOCX files (Word documents)
- Audio files (WAV, MP3, M4A)

**Features:**
- Drag-and-drop interface
- File type validation
- Size limit: 10MB
- Progress indicator
- Error handling for unsupported formats

#### 5. Design System (`public/design-system.css`)

**Color Palette:**
```css
--primary-purple: #6366f1
--hover-purple: #4f46e5
--light-purple: #818cf8
--ultra-light: #e0e7ff
--success-green: #10b981
--error-red: #ef4444
--warning-yellow: #f59e0b
```

**Typography:**
```css
--font-family: 'SF Pro Display', 'Segoe UI', 'Roboto', system-ui
--font-mono: 'SF Mono', 'Cascadia Code', 'Consolas', monospace
--font-size-xs: 0.75rem
--font-size-sm: 0.875rem
--font-size-base: 1rem
--font-size-lg: 1.125rem
--font-size-xl: 1.25rem
--font-size-2xl: 1.5rem
--font-size-3xl: 1.875rem
```

**Spacing Scale:**
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

**Components:**
- Buttons (primary, secondary, ghost, success, danger)
- Cards with shadows and hover states
- Modals with backdrop blur
- Forms with focus states
- Icons (24px default, flat design, inline SVG)
- Loading spinners
- Toast notifications

#### 6. Authentication Integration

**Clerk Components:**
- Sign-in widget
- Sign-up widget
- User profile button
- Session management

**Frontend Auth Flow:**
```javascript
// Check authentication
const token = await Clerk.session.getToken();

// Make authenticated API call
fetch('/api/ai/generate-story', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

#### 7. Performance Optimizations

- **Minified Assets:** JS and CSS minified for production
- **Lazy Loading:** Images and modals loaded on demand
- **Debouncing:** Search inputs debounced (300ms)
- **Event Delegation:** Efficient DOM event handling
- **Local Storage:** Caches user preferences
- **CDN Integration:** Clerk loaded from CDN

### Frontend Best Practices

1. **No frameworks** - Vanilla JavaScript for speed and control
2. **Progressive enhancement** - Works without JavaScript for basic functionality
3. **Mobile-first** - Responsive design with media queries
4. **Accessibility** - ARIA labels, keyboard navigation, focus management
5. **Security** - XSS prevention through HTML escaping
6. **CSP compliance** - No inline event handlers (uses addEventListener)

---

## 🗄️ Database Resume

### Overview

The database is PostgreSQL hosted on Supabase, featuring Row-Level Security (RLS), performance indexes, and support for complex story metadata. The schema supports 5/10/15/20-line stories with expansion chains and audio/document processing.

### Database Tables

#### 1. Conversations Table (Primary Storage)

Stores all user-generated stories with full metadata.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                    -- Clerk user ID
  user_input TEXT,                          -- Original story idea
  ai_response JSONB NOT NULL,               -- 5/10/15/20-line story (JSON)
  title TEXT,                               -- Story title (auto-generated)

  -- Expansion support
  story_level INTEGER DEFAULT 5,            -- 5, 10, 15, or 20 lines
  parent_story_id UUID,                     -- Reference to parent story (for expansions)
  accumulated_metadata JSONB DEFAULT '{}',  -- Context from all inputs
  user_inputs_history JSONB DEFAULT '[]',   -- All user inputs in expansion chain

  -- Prompt tracking
  prompt_used TEXT,                         -- First 500 chars of prompt
  prompt_type TEXT,                         -- 'suggest_paths', 'generate_story', 'refine_line', 'expand_story'

  -- Token usage
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT fk_parent FOREIGN KEY (parent_story_id)
    REFERENCES conversations(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_parent_story ON conversations(parent_story_id);
CREATE INDEX idx_conversations_story_level ON conversations(story_level);
```

**ai_response JSON Structure:**
```json
{
  "lines": [
    "Line 1: Context/Situation",
    "Line 2: Desire/Objective",
    "Line 3: Obstacle/Conflict",
    "Line 4: Action/Attempt",
    "Line 5: Result/Transformation"
  ],
  "title": "Auto-generated Story Title",
  "metadata": {
    "narrative_path": "Selected path description",
    "genre": "personal/business/brand",
    "tone": "inspirational/professional/dramatic"
  }
}
```

#### 2. User Limits Table (Plan Management)

Tracks user plans and usage limits (currently not enforced - all users have full access).

```sql
CREATE TABLE user_limits (
  user_id TEXT PRIMARY KEY,               -- Clerk user ID
  plan_type TEXT DEFAULT 'free',          -- 'free', 'pro', 'unlimited'

  -- Story limits
  monthly_story_limit INTEGER DEFAULT 50,
  stories_used_this_month INTEGER DEFAULT 0,

  -- Token limits
  tokens_limit_monthly BIGINT DEFAULT 100000,
  tokens_used_this_month BIGINT DEFAULT 0,

  -- Reset tracking
  limit_reset_date TIMESTAMP DEFAULT (NOW() + INTERVAL '1 month'),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_limits_plan_type ON user_limits(plan_type);
CREATE INDEX idx_user_limits_reset_date ON user_limits(limit_reset_date);
```

#### 3. Usage Tracking Table (Analytics)

Detailed token usage per request for cost analysis.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conversation_id UUID,                   -- Reference to conversations table

  -- Request details
  prompt_type TEXT,                       -- Type of AI request

  -- Token usage
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- Cost calculation
  cost_usd DECIMAL(10, 6),                -- Calculated cost in USD

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexes for analytics queries
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at DESC);
CREATE INDEX idx_usage_tracking_prompt_type ON usage_tracking(prompt_type);
```

### Row-Level Security (RLS)

Ensures users can only access their own data.

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (user_id = current_setting('app.user_id')::TEXT);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id')::TEXT);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (user_id = current_setting('app.user_id')::TEXT);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (user_id = current_setting('app.user_id')::TEXT);
```

### Database Functions

#### Get User Statistics
```sql
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_stories', COUNT(*),
    'total_tokens', SUM(tokens_used),
    'total_cost_usd', SUM(
      (input_tokens * 3.0 / 1000000) +
      (output_tokens * 15.0 / 1000000)
    ),
    'stories_by_level', (
      SELECT json_object_agg(story_level, count)
      FROM (
        SELECT story_level, COUNT(*) as count
        FROM conversations
        WHERE user_id = p_user_id
        GROUP BY story_level
      ) counts
    )
  )
  FROM conversations
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL;
```

### Migrations

All database migrations are located in `/database/` directory:

| File | Purpose |
|------|---------|
| `add_title_column.sql` | Adds title support to conversations |
| `add_story_expansion_support.sql` | Adds expansion fields (story_level, parent_story_id, etc.) |
| `add_audio_document_support.sql` | Adds audio/document processing metadata |
| `enable_rls.sql` | Enables Row-Level Security policies |
| `fix_user_input_length_constraint.sql` | Removes length constraints for large inputs |
| `performance_indexes.sql` | Creates optimized indexes |

**Migration Instructions:** See `/database/README.md`

### Database Configuration

**Connection Details (Supabase):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

**Connection Pooling:**
- Supabase manages connection pooling automatically
- Default pool size: 15 connections
- Idle timeout: 10 minutes

### Backup Strategy

1. **Automatic Backups:** Supabase provides daily backups (7-day retention)
2. **Point-in-Time Recovery:** Available for paid Supabase plans
3. **Manual Exports:** Use `pg_dump` for manual backups

### Database Best Practices

1. **Use indexes** - All foreign keys and frequently queried fields indexed
2. **JSONB for flexibility** - AI responses stored as JSONB for schema flexibility
3. **Timestamps everywhere** - All tables have created_at/updated_at
4. **Soft deletes** - Consider adding deleted_at for audit trail
5. **RLS enabled** - Prevents data leaks between users

---

## 🔌 API Endpoints

### AI Routes (`/api/ai`)

All AI routes require authentication (JWT token in Authorization header).

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/ai/suggest-paths` | Generate 3 story path suggestions | `{ userInput: string, storyType?: string }` | `{ paths: string[], tokensUsed: number }` |
| POST | `/api/ai/generate-story` | Create complete 5-line story | `{ userInput: string, narrativePath: string, storyLevel?: 5\|10\|15\|20 }` | `{ story: object, conversationId: string, tokensUsed: number }` |
| POST | `/api/ai/refine-line` | Edit a single story line | `{ conversationId: string, lineIndex: number, currentLine: string, instruction: string }` | `{ refinedLine: string, tokensUsed: number }` |
| POST | `/api/ai/expand-story` | Expand story to 10/15/20 lines | `{ conversationId: string, targetLevel: 10\|15\|20 }` | `{ expandedStory: object, newConversationId: string }` |
| GET | `/api/ai/usage` | Get user's token/story usage | - | `{ storiesUsed: number, tokensUsed: number, costUSD: number }` |
| GET | `/api/ai/history` | Get user's stories (50 most recent) | - | `{ conversations: array }` |
| DELETE | `/api/ai/history/:id` | Delete a specific story | - | `{ message: 'Story deleted successfully' }` |
| PATCH | `/api/ai/update-story/:id` | Update story title or content | `{ title?: string, ai_response?: object }` | `{ message: 'Story updated successfully' }` |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/users` | List all users | - | `{ users: array }` |
| POST | `/api/users` | Create new user | `{ userId: string, email: string }` | `{ user: object }` |
| GET | `/api/users/:id` | Get user by ID | - | `{ user: object }` |

### System Routes

| Method | Endpoint | Auth Required | Description | Response |
|--------|----------|---------------|-------------|----------|
| GET | `/api/health` | ❌ | Health check | `{ status: 'ok', timestamp: string }` |
| GET | `/api/me` | ❌ | Check auth status | `{ authenticated: boolean, userId?: string }` |

### Rate Limits

- **General API:** 100 requests / 15 minutes per IP
- **AI Endpoints:** 30 requests / 15 minutes per IP

### Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (exceeded rate limit)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔒 Security

### Security Features

✅ **Helmet** - Security headers (CSP, X-Frame-Options, HSTS, etc.)
✅ **CORS** - Cross-origin protection with whitelist
✅ **Rate Limiting** - 30 requests/15min for AI endpoints
✅ **JWT Authentication** - Clerk-based secure authentication
✅ **Input Validation** - Joi schema validation
✅ **XSS Protection** - HTML escaping on frontend
✅ **Prompt Injection Prevention** - Input sanitization
✅ **CSP Compliance** - No inline event handlers
✅ **HTTPS Ready** - TLS/SSL encryption
✅ **Row-Level Security** - Database-level access control

### Content Security Policy (CSP)

```javascript
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.clerk.com"],
    connectSrc: [
      "'self'",
      "https://api.anthropic.com",
      "https://*.supabase.co",
      "https://api.clerk.com"
    ],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"]
  }
})
```

### Input Validation

All user inputs are validated using Joi schemas:

```javascript
// Example: Story generation validation
const generateStorySchema = Joi.object({
  userInput: Joi.string().min(10).max(5000).required(),
  narrativePath: Joi.string().max(2000).required(),
  storyLevel: Joi.number().valid(5, 10, 15, 20).default(5)
});
```

### Prompt Injection Prevention

```javascript
function sanitizeInput(text) {
  // Remove potential prompt injection attacks
  return text
    .replace(/\{system\}/gi, '')
    .replace(/\{assistant\}/gi, '')
    .replace(/\{user\}/gi, '')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '');
}
```

### Token Costs & Budget Control

- **Average cost per story:** ~$0.015 (1.5 cents)
- **Rate limits** prevent runaway costs
- **Token tracking** for budget monitoring
- **User limits** can be enforced if needed

---

## 🚢 Deployment

### Current Hosting

- **Platform:** Render.com
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Auto-Deploy:** Enabled on push to main branch

### Environment Variables (Production)

Set in Render dashboard:

```bash
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
ALLOWED_ORIGINS=https://www.storymaking.ai,https://storymaking.ai
NODE_ENV=production
PORT=3000
```

### Pre-Deployment Checklist

- [ ] Run database migrations
- [ ] Set production environment variables
- [ ] Update CORS to specific domain
- [ ] Verify rate limits
- [ ] Test all user flows
- [ ] Check mobile responsiveness
- [ ] Run Lighthouse audit
- [ ] Enable Sentry error monitoring
- [ ] Configure PostHog analytics
- [ ] Test authentication flow
- [ ] Verify API endpoints
- [ ] Check CSP compliance

### Monitoring & Maintenance

**Error Monitoring:**
- **Sentry:** Error tracking and performance monitoring
- Dashboard: https://sentry.io

**Analytics:**
- **PostHog:** User behavior and feature usage
- Self-hosted or cloud option

**Uptime Monitoring:**
- Recommended: UptimeRobot or Pingdom
- Health check endpoint: `/api/health`

---

## 📚 Documentation

### Available Documentation

| Document | Description |
|----------|-------------|
| `README.md` | This file - comprehensive application overview |
| `LAUNCH_RECOMMENDATIONS.md` | 60+ recommendations for production launch |
| `PRODUCTION_READY.md` | Production readiness checklist |
| `AUDIO_DOCUMENT_IMPLEMENTATION.md` | Audio/document processing feature documentation |
| `SUPABASE_SCHEMA_IMPROVEMENTS.md` | Database schema documentation and improvements |
| `SENTRY_SETUP.md` | Error monitoring setup guide |
| `POSTHOG_SETUP.md` | Analytics setup guide |
| `IMPROVEMENTS_SUMMARY.md` | Summary of recent improvements |
| `TESTING_GUIDE.md` | Manual testing guide |
| `PERFORMANCE_OPTIMIZATION.md` | Performance optimization tips |
| `MOBILE_ANALYSIS.md` | Mobile responsiveness analysis |
| `database/README.md` | Database migration guide |

### Additional Resources

- **Terms of Service:** [www.storymaking.ai/terms.html](https://www.storymaking.ai/terms.html)
- **Privacy Policy:** [www.storymaking.ai/privacy.html](https://www.storymaking.ai/privacy.html)

---

## 🤝 Contributing

This is a proprietary project. If you're part of the team:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly (see `TESTING_GUIDE.md`)
4. Commit: `git commit -m "feat: your feature description"`
5. Push: `git push origin feature/your-feature`
6. Create a pull request

### Commit Message Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, styling
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📊 Key Metrics

### Application Statistics

- **Total Codebase:** 178,309 lines
- **Backend Code:** 2,000+ lines (Node.js/Express)
- **Frontend Code:** 4,700+ lines (Vanilla JavaScript)
- **Design System:** 11,260 lines (Custom CSS)
- **Database Tables:** 3 (conversations, user_limits, usage_tracking)
- **API Endpoints:** 12 (8 AI routes, 3 user routes, 1 health check)

### Performance Metrics

- **Average Response Time:** <3 seconds for story generation
- **Average Story Cost:** ~$0.015 USD (1.5 cents)
- **Token Usage:** ~650 tokens per complete story
- **Frontend Load Time:** <2 seconds (initial load)

### Pricing (Anthropic Claude Sonnet 4)

- **Input tokens:** $3.00 per 1M tokens
- **Output tokens:** $15.00 per 1M tokens

---

## 📞 Support & Contact

- **Website:** [www.storymaking.ai](https://www.storymaking.ai)
- **Support:** support@storymaking.ai
- **Legal:** legal@storymaking.ai
- **Privacy:** privacy@storymaking.ai

---

## 📄 License

Proprietary and confidential. All rights reserved.

© 2025 StoryMaking.AI. Not for public distribution.

---

## 🙏 Acknowledgments

- **Anthropic** - Claude AI technology
- **Clerk** - Authentication infrastructure
- **Supabase** - Database platform
- **Render** - Hosting platform

---

**Built with ❤️ by the StoryMaking.AI team**

**Version:** 9.1.0
**Last Updated:** November 9, 2025
**Status:** Production Ready 🚀
