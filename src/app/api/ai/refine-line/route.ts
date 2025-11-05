import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { anthropic, MODEL, MAX_TOKENS, TEMPERATURE, calculateCost } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPrompt } from '@/lib/prompts'
import { ApiResponse, RefineLineResponse, RefineLineRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: RefineLineRequest = await request.json()
    const { story, lineNumber, suggestion } = body

    if (!story || !lineNumber || !suggestion) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const systemPrompt = getPrompt('refine_line')
    const userMessage = `
5 LINHAS ATUAIS:
Linha 1: ${story.line1}
Linha 2: ${story.line2}
Linha 3: ${story.line3}
Linha 4: ${story.line4}
Linha 5: ${story.line5}

LINHA PARA MODIFICAR: ${lineNumber}
SUGESTÃO DO USUÁRIO: ${suggestion}
`

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const content = message.content[0].text
    const usage = message.usage

    let refinedData: RefineLineResponse
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      refinedData = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (parseError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    const cost = calculateCost(usage.input_tokens, usage.output_tokens)
    const totalTokens = usage.input_tokens + usage.output_tokens

    await supabaseAdmin.from('usage_tracking').insert([
      {
        user_id: userId,
        prompt_type: 'refine_line',
        tokens_used: totalTokens,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cost_usd: cost,
      },
    ])

    return NextResponse.json<ApiResponse<RefineLineResponse>>({
      success: true,
      data: refinedData,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        total_tokens: totalTokens,
        cost_usd: cost,
      },
    })
  } catch (error) {
    console.error('Error in refine-line:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
