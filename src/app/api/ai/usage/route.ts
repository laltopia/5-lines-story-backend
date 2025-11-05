import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ApiResponse, UsageStats } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: limits, error } = await supabaseAdmin
      .from('user_limits')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    if (!limits) {
      return NextResponse.json<ApiResponse<UsageStats>>({
        success: true,
        data: {
          stories_used: 0,
          stories_limit: 999999,
          tokens_used: 0,
          tokens_limit: 999999999,
          cost_usd: 0,
          limit_reset_date: new Date().toISOString(),
        },
      })
    }

    // Calculate total cost from usage_tracking
    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('cost_usd')
      .eq('user_id', userId)

    const totalCost = usage?.reduce((sum, item) => sum + (item.cost_usd || 0), 0) || 0

    return NextResponse.json<ApiResponse<UsageStats>>({
      success: true,
      data: {
        stories_used: limits.stories_used_this_month,
        stories_limit: limits.monthly_story_limit,
        tokens_used: limits.tokens_used_this_month,
        tokens_limit: limits.tokens_limit_monthly,
        cost_usd: totalCost,
        limit_reset_date: limits.limit_reset_date,
      },
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
