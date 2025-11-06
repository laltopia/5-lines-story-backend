import Anthropic from '@anthropic-ai/sdk'

// Use placeholder during build, real value at runtime
const apiKey = process.env.ANTHROPIC_API_KEY || 'placeholder-anthropic-key'

export const anthropic = new Anthropic({
  apiKey,
})

export const MODEL = 'claude-sonnet-4-20250514'
export const MAX_TOKENS = 2000
export const TEMPERATURE = 0.7

// Pricing (per 1M tokens)
export const PRICING = {
  INPUT: 3.0,
  OUTPUT: 15.0,
}

export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICING.INPUT
  const outputCost = (outputTokens / 1_000_000) * PRICING.OUTPUT
  return inputCost + outputCost
}
