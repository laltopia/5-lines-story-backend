import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { anthropic, MODEL, MAX_TOKENS, TEMPERATURE, calculateCost } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPrompt, detectLanguage } from '@/lib/prompts'
import { ApiResponse, PathsResponse, SuggestPathsRequest } from '@/types'

async function ensureUserTracking(userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    const { data: newUser, error } = await supabaseAdmin
      .from('user_limits')
      .insert([
        {
          user_id: userId,
          plan_type: 'unlimited',
          monthly_story_limit: 999999,
          tokens_limit_monthly: 999999999,
          stories_used_this_month: 0,
          tokens_used_this_month: 0,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return newUser
  }

  return existing
}

async function updateTokenUsage(userId: string, tokensToAdd: number) {
  const { data: current } = await supabaseAdmin
    .from('user_limits')
    .select('tokens_used_this_month')
    .eq('user_id', userId)
    .single()

  if (!current) return

  await supabaseAdmin
    .from('user_limits')
    .update({
      tokens_used_this_month: current.tokens_used_this_month + tokensToAdd,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: SuggestPathsRequest = await request.json()
    const { userInput } = body

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User input is required' },
        { status: 400 }
      )
    }

    await ensureUserTracking(userId)

    const language = detectLanguage(userInput)
    const systemPrompt = getPrompt('suggest_paths')

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    })

    const content = message.content[0].text
    const usage = message.usage

    // Parse JSON response
    let paths: PathsResponse
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      paths = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (parseError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Calculate cost
    const cost = calculateCost(usage.input_tokens, usage.output_tokens)
    const totalTokens = usage.input_tokens + usage.output_tokens

    // Update token usage
    await updateTokenUsage(userId, totalTokens)

    // Track usage
    await supabaseAdmin.from('usage_tracking').insert([
      {
        user_id: userId,
        prompt_type: 'suggest_paths',
        tokens_used: totalTokens,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cost_usd: cost,
      },
    ])

    return NextResponse.json<ApiResponse<PathsResponse>>({
      success: true,
      data: paths,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: totalTokens,
        cost_usd: cost,
      },
    })
  } catch (error) {
    console.error('Error in suggest-paths:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
