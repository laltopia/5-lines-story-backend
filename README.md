# 5 Lines Story - Next.js Edition

**Version 12.0** - Complete rewrite in Next.js with enhanced security, performance, and modern architecture.

Transform your ideas into compelling narratives with AI-powered storytelling using the proven 5-line methodology.

## 🚀 What's New in v12

- ✅ **Next.js 14** with App Router and Server Components
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** for modern, clean UI
- ✅ **Enhanced Security** with security headers and CSP
- ✅ **Optimized Performance** with SSR, ISR, and lazy loading
- ✅ **Clerk Auth** native Next.js integration
- ✅ **Standardized UI/UX** across all pages
- ✅ **Clean Design** with minimal icons
- ✅ **UserJot Integration** for user feedback

## 📋 Features

### 🎯 5-Line Storytelling Methodology

Structure any story in 5 compelling lines:
1. **Context/Situation** - Where? Who? What's the scenario?
2. **Desire/Objective** - What's the goal?
3. **Obstacle/Conflict** - What's the challenge?
4. **Action/Attempt** - What was done?
5. **Result/Transformation** - What changed?

### 🤖 AI-Powered

- Powered by **Claude Sonnet 4** (Anthropic)
- Generate 3 narrative path suggestions
- Create complete 5-line stories
- Refine individual lines with AI
- Multi-language support (PT, EN, ES, FR, DE)

### 🔒 Security Features

- Security headers (CSP, HSTS, X-Frame-Options)
- Environment variable protection
- Server-side API routes only
- Clerk authentication middleware
- Supabase RLS policies

### ⚡ Performance

- Next.js optimizations (SSR, ISR)
- Image optimization
- Code splitting
- Lazy loading
- Efficient caching strategies

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Feedback**: UserJot
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
```bash
git clone <your-repo>
cd 5-lines-story-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-...
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

### Supabase Tables

```sql
-- user_limits table
CREATE TABLE user_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan_type TEXT DEFAULT 'unlimited',
  monthly_story_limit INTEGER DEFAULT 999999,
  tokens_limit_monthly INTEGER DEFAULT 999999999,
  stories_used_this_month INTEGER DEFAULT 0,
  tokens_used_this_month INTEGER DEFAULT 0,
  limit_reset_date TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_input TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  prompt_used TEXT,
  prompt_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- usage_tracking table
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd FLOAT DEFAULT 0,
  conversation_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── ai/           # AI endpoints
│   ├── story/            # Story creation page
│   ├── history/          # Story history page
│   ├── pricing/          # Pricing page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Navbar.tsx        # Navigation
│   ├── Footer.tsx        # Footer
│   └── UserJotWidget.tsx # Feedback widget
├── lib/                   # Utilities and configs
│   ├── supabase/         # Supabase clients
│   ├── anthropic.ts      # Anthropic config
│   ├── prompts.ts        # AI prompts
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript types
    └── index.ts          # Type definitions
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Render

> **🚨 Quick Fix:** See `RENDER_FIX_NOW.md` for urgent deployment instructions!

#### Simple 2-Step Configuration

1. **Configure in Render Dashboard:**
   ```
   Build Command: npm ci
   Start Command: npm start
   Node Version: 18.17.0
   ```

2. **Add environment variables:**
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`

3. **Deploy!** (Clear build cache first for best results)

> **How it works:** The `npm start` script automatically checks for a production build. If missing, it builds the app first, then starts the server. This prevents "no production build found" errors.

### Environment Variables Required

Set these in your deployment platform:
- `NODE_ENV` (production)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

## 📚 API Endpoints

### POST /api/ai/suggest-paths
Generate 3 narrative path suggestions.

### POST /api/ai/generate-story
Generate complete 5-line story.

### POST /api/ai/refine-line
Refine a specific line of the story.

### GET /api/ai/history
Get user's story history (last 50).

### GET /api/ai/usage
Get user's usage statistics.

## 🎨 Design Principles

- **Clean & Minimal**: Removed unnecessary icons, focused on content
- **Consistent**: Standardized UI/UX across all pages
- **Responsive**: Mobile-first design
- **Accessible**: WCAG compliant
- **Fast**: Optimized for performance

## 🔐 Security

- Security headers configured in `next.config.js`
- All API routes protected with Clerk middleware
- Environment variables never exposed to client
- Supabase RLS policies enforced
- HTTPS enforced in production

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. For issues or suggestions, use the UserJot feedback widget.

---

**Built with ❤️ using Next.js, TypeScript, and Claude AI**
