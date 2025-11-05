import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { anthropic, MODEL, MAX_TOKENS, TEMPERATURE, calculateCost } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPrompt } from '@/lib/prompts'
import { ApiResponse, GenerateStoryResponse, GenerateStoryRequest } from '@/types'

async function updateUsage(userId: string, totalTokens: number) {
  const { data } = await supabaseAdmin
    .from('user_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (data) {
    await supabaseAdmin
      .from('user_limits')
      .update({
        stories_used_this_month: data.stories_used_this_month + 1,
        tokens_used_this_month: data.tokens_used_this_month + totalTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
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

    const body: GenerateStoryRequest = await request.json()
    const { userInput, selectedPath, customDirection } = body

    if (!userInput) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User input is required' },
        { status: 400 }
      )
    }

    const systemPrompt = getPrompt('generate_story')
    const direction = customDirection || selectedPath?.description || ''

    const userMessage = `INPUT ORIGINAL: ${userInput}\n\nCAMINHO/DIREÇÃO: ${direction}`

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = message.content[0]
    if (textBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude API')
    }
    const content = textBlock.text
    const usage = message.usage

    // Parse JSON response
    let storyData: GenerateStoryResponse
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      storyData = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (parseError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    const cost = calculateCost(usage.input_tokens, usage.output_tokens)
    const totalTokens = usage.input_tokens + usage.output_tokens

    // Save to conversations
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .insert([
        {
          user_id: userId,
          user_input: userInput,
          ai_response: storyData.story,
          prompt_used: systemPrompt.substring(0, 500),
          prompt_type: 'generate_story',
          tokens_used: totalTokens,
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
        },
      ])
      .select()
      .single()

    // Update usage
    await updateUsage(userId, totalTokens)

    // Track usage
    await supabaseAdmin.from('usage_tracking').insert([
      {
        user_id: userId,
        prompt_type: 'generate_story',
        tokens_used: totalTokens,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cost_usd: cost,
        conversation_id: conversation?.id,
      },
    ])

    return NextResponse.json<ApiResponse<GenerateStoryResponse & { conversationId: string }>>({
      success: true,
      data: {
        ...storyData,
        conversationId: conversation?.id || '',
      },
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: totalTokens,
        cost_usd: cost,
      },
    })
  } catch (error) {
    console.error('Error in generate-story:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
