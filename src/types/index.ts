// Story types
export interface Story {
  line1: string
  line2: string
  line3: string
  line4: string
  line5: string
}

export interface StoryMetadata {
  language: string
  tone: string
  themes: string[]
}

export interface StoryPath {
  id: number
  title: string
  description: string
  focus: string
}

export interface PathsResponse {
  paths: StoryPath[]
}

export interface GenerateStoryResponse {
  story: Story
  metadata: StoryMetadata
}

export interface RefineLineResponse {
  story: Story
  changed_line: number
  explanation: string
}

// Conversation types
export interface Conversation {
  id: string
  user_id: string
  user_input: string
  ai_response: Story
  prompt_used: string
  prompt_type: 'suggest_paths' | 'generate_story' | 'refine_line'
  tokens_used: number
  input_tokens: number
  output_tokens: number
  created_at: string
  updated_at: string
}

// User types
export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface UserLimits {
  id: string
  user_id: string
  plan_type: string
  monthly_story_limit: number
  tokens_limit_monthly: number
  stories_used_this_month: number
  tokens_used_this_month: number
  limit_reset_date: string
  updated_at: string
}

export interface UsageTracking {
  id: string
  user_id: string
  prompt_type: string
  tokens_used: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  conversation_id: string
  created_at: string
}

// API Request/Response types
export interface SuggestPathsRequest {
  userInput: string
}

export interface GenerateStoryRequest {
  userInput: string
  selectedPath?: StoryPath
  customDirection?: string
}

export interface RefineLineRequest {
  story: Story
  lineNumber: 1 | 2 | 3 | 4 | 5
  suggestion: string
}

export interface UsageStats {
  stories_used: number
  stories_limit: number
  tokens_used: number
  tokens_limit: number
  cost_usd: number
  limit_reset_date: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_usd: number
  }
}
