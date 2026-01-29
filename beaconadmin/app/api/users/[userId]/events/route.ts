import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch user's events with community information
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        is_private,
        is_community_event,
        created_at,
        community:community_id (
          id,
          name
        )
      `)
      .eq('created_by', userId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching user events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Fetch user events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}