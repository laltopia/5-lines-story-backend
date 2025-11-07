# StoryMaking.AI

**Transform ideas into compelling 5-line stories with AI assistance.**

[![Production Ready](https://img.shields.io/badge/status-production--ready-green)](https://www.storymaking.ai)
[![Version](https://img.shields.io/badge/version-9.1.0-blue)](https://github.com/laltopia/5-lines-story-backend)
[![License](https://img.shields.io/badge/license-proprietary-red)]()

---

## 🎯 Overview

StoryMaking.AI is a full-stack web application that uses Claude AI (Anthropic) to help users create structured 5-line stories. The application guides users through a step-by-step process: from initial idea → AI-generated story paths → complete 5-line story → line-by-line refinement.

**Live Site:** [www.storymaking.ai](https://www.storymaking.ai)

---

## ✨ Features

- 🎨 **AI-Powered Story Paths** - Get 3 narrative direction suggestions for any story idea
- 📖 **5-Line Story Generation** - Create complete structured stories in seconds
- ✍️ **Line-by-Line Refinement** - Edit and improve individual lines with AI assistance
- 💾 **Story History** - Save, organize, and manage all your stories
- 🎯 **Title Editing** - Edit story titles directly in the UI
- 📤 **Story Sharing** - Share stories via social media
- 📊 **Usage Tracking** - Monitor token usage and costs
- 🔐 **Secure Authentication** - Clerk-based user authentication
- 🎨 **Beautiful UI** - Minimalistic purple design system with flat icons

---

## 🏗️ Tech Stack

### Frontend
- **HTML5** + **CSS3** (Design System)
- **Vanilla JavaScript** (ES6+)
- **SVG Icons** (inline, flat design)

### Backend
- **Node.js** v18+
- **Express.js** v4.18.2
- **Security**: Helmet, CORS, Rate Limiting, CSP

### Database
- **Supabase** (PostgreSQL)
- Tables: `conversations`, `user_limits`, `usage_tracking`

### Third-Party Services
- **Clerk** - Authentication (JWT-based)
- **Anthropic Claude** - AI story generation (Sonnet 4)
- **Render.com** - Hosting and deployment

---

## 📁 Project Structure

```
5-lines-story-backend/
├── backend/
│   ├── config/
│   │   ├── prompts.js          # AI prompt templates
│   │   └── supabase.js         # Database client
│   ├── middleware/
│   │   └── auth.js             # Clerk authentication middleware
│   ├── routes/
│   │   ├── ai.js               # AI endpoints (612 lines)
│   │   └── users.js            # User management (84 lines)
│   ├── utils/
│   │   └── validation.js       # Input validation & sanitization
│   └── server.js               # Express app (129 lines)
│
├── public/
│   ├── index.html              # Landing page
│   ├── ai.html                 # Story creation interface
│   ├── history.html            # Story history
│   ├── pricing.html            # Pricing page
│   ├── terms.html              # Terms of Service
│   ├── privacy.html            # Privacy Policy
│   ├── ai.js                   # Story creation logic (748 lines)
│   ├── history.js              # History management (630 lines)
│   ├── app.js                  # Common utilities (93 lines)
│   ├── design-system.css       # Design system (7,700+ lines)
│   └── styles.css              # Legacy styles
│
├── database/
│   ├── add_title_column.sql    # Migration: Add title support
│   ├── performance_indexes.sql # Migration: Database indexes
│   ├── enable_rls.sql          # Migration: Row level security
│   └── README.md               # Migration guide
│
├── LAUNCH_RECOMMENDATIONS.md   # Comprehensive launch guide
├── package.json
└── README.md                   # This file
```

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
   Create a `.env` file (not committed to Git) with the following:
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

   # CORS (for production, use specific domain)
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Run database migrations:**
   - Open Supabase SQL Editor
   - Run `database/add_title_column.sql`
   - Run `database/performance_indexes.sql`
   - Run `database/enable_rls.sql` (optional but recommended)

5. **Start the development server:**
   ```bash
   npm start
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 📊 Database Schema

### Conversations Table
Stores all user-generated stories.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id TEXT,                  -- Clerk user ID
  user_input TEXT,               -- Original story idea
  ai_response JSONB,             -- 5-line story (JSON)
  title TEXT,                    -- Story title
  prompt_used TEXT,              -- First 500 chars of prompt
  prompt_type TEXT,              -- 'suggest_paths', 'generate_story', 'refine_line'
  tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### User Limits Table
Tracks user plan and usage.

```sql
CREATE TABLE user_limits (
  user_id TEXT PRIMARY KEY,      -- Clerk user ID
  plan_type TEXT,                -- 'free', 'pro', 'unlimited'
  monthly_story_limit INTEGER,
  tokens_limit_monthly BIGINT,
  stories_used_this_month INTEGER,
  tokens_used_this_month BIGINT,
  limit_reset_date TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Usage Tracking Table
Detailed token usage per request.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY,
  user_id TEXT,
  conversation_id UUID,
  prompt_type TEXT,
  tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMP
);
```

---

## 🔌 API Endpoints

### AI Routes (`/api/ai`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/suggest-paths` | ✅ | Generate 3 story path suggestions |
| POST | `/api/ai/generate-story` | ✅ | Create complete 5-line story |
| POST | `/api/ai/refine-line` | ✅ | Edit a single story line |
| GET | `/api/ai/usage` | ✅ | Get user's token/story usage |
| GET | `/api/ai/history` | ✅ | Get user's stories (limit: 50) |
| DELETE | `/api/ai/history/:id` | ✅ | Delete a specific story |
| PATCH | `/api/ai/update-story/:id` | ✅ | Update story title or content |

### User Routes (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ✅ | List all users |
| POST | `/api/users` | ✅ | Create new user |
| GET | `/api/users/:id` | ✅ | Get user by ID |

### System Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Health check |
| GET | `/api/me` | ❌ | Check auth status |

---

## 🔒 Security Features

- ✅ **Helmet** - Security headers (CSP, X-Frame-Options, etc.)
- ✅ **CORS** - Cross-origin resource sharing protection
- ✅ **Rate Limiting** - 30 requests/15min for AI endpoints
- ✅ **JWT Authentication** - Clerk-based secure authentication
- ✅ **Input Validation** - Joi schema validation
- ✅ **XSS Protection** - HTML escaping on frontend
- ✅ **Prompt Injection Prevention** - Input sanitization
- ✅ **CSP Compliance** - No inline event handlers
- ✅ **HTTPS Ready** - TLS/SSL encryption

---

## 📈 Usage & Costs

### Token Pricing (Anthropic Claude Sonnet 4)
- **Input tokens:** $3.00 per 1M tokens
- **Output tokens:** $15.00 per 1M tokens

### Average Cost Per Story
- **Path suggestion:** ~450 tokens (~$0.0045)
- **Story generation:** ~650 tokens (~$0.0065)
- **Line refinement:** ~380 tokens (~$0.0038)
- **Total per story:** ~$0.015 (1.5 cents)

### Rate Limits
- **General API:** 100 requests / 15 minutes per IP
- **AI Endpoints:** 30 requests / 15 minutes per IP

---

## 🎨 Design System

### Color Palette
- **Primary Purple:** `#6366f1`
- **Hover Purple:** `#4f46e5`
- **Light Purple:** `#818cf8`
- **Ultra Light:** `#e0e7ff`
- **Success Green:** `#10b981`

### Typography
- **Font:** SF Pro Display, Segoe UI, Roboto, system-ui
- **Monospace:** SF Mono, Cascadia Code, Consolas

### Spacing Scale
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### Components
- Buttons (primary, secondary, ghost, success)
- Cards with shadows and hover effects
- Icons (24px default, flat design)
- Forms with focus states
- Modals with backdrop

---

## 🧪 Testing

### Manual Testing
1. Clear browser cache (Ctrl+Shift+R)
2. Open DevTools (F12)
3. Test story creation flow:
   - Enter story idea (10+ chars)
   - Select or customize path
   - Generate story
   - Edit individual lines
   - Save to history
4. Test history management:
   - View stories
   - Edit titles
   - Delete stories
   - Share stories

### Automated Testing
**Status:** Not yet implemented

**Recommended:**
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)

See `LAUNCH_RECOMMENDATIONS.md` Section 2.1 for test implementation guide.

---

## 🚢 Deployment

### Current Hosting
- **Platform:** Render.com
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Branch:** `claude/improve-app-security-011CUs3uvDcuSfk2Tw4gEMvP`

### Environment Variables (Production)
Ensure all environment variables are set in Render dashboard:
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `ANTHROPIC_API_KEY`
- `ALLOWED_ORIGINS=https://www.storymaking.ai,https://storymaking.ai`
- `NODE_ENV=production`

### Pre-Deployment Checklist
- [ ] Run database migrations
- [ ] Set production environment variables
- [ ] Update CORS to specific domain
- [ ] Verify rate limits
- [ ] Test all user flows
- [ ] Check mobile responsiveness
- [ ] Run Lighthouse audit

---

## 📚 Documentation

- **Launch Recommendations:** [`LAUNCH_RECOMMENDATIONS.md`](./LAUNCH_RECOMMENDATIONS.md) - Comprehensive guide with 60+ recommendations
- **Database Migrations:** [`database/README.md`](./database/README.md) - Migration instructions
- **Terms of Service:** [www.storymaking.ai/terms.html](https://www.storymaking.ai/terms.html)
- **Privacy Policy:** [www.storymaking.ai/privacy.html](https://www.storymaking.ai/privacy.html)

---

## 🤝 Contributing

This is a private/proprietary project. If you're part of the team:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
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

## 🐛 Known Issues

See `LAUNCH_RECOMMENDATIONS.md` for comprehensive issue tracking and prioritization.

**Critical:**
- None currently

**High Priority:**
- No automated tests
- CSS/JS not minified
- Loading states missing during AI calls

---

## 📊 Metrics & Monitoring

### Key Metrics to Track
- Signup → first story conversion
- Stories created per user per week
- Free → Pro conversion rate
- Token costs per user
- API response times
- Error rates

### Recommended Tools
- **Error Monitoring:** Sentry
- **Uptime Monitoring:** UptimeRobot
- **Analytics:** Plausible or PostHog
- **APM:** New Relic or Datadog

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
**Last Updated:** November 7, 2025
**Status:** Production Ready 🚀
