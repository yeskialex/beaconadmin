import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: communityId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch community events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('community_id', communityId)
      .order('start_time', { ascending: false })

    if (eventsError) {
      console.error('Error fetching community events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    // Get author information for each event
    const eventsWithAuthors = await Promise.all(
      (events || []).map(async (event) => {
        let authorData = null
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(event.created_by)
          if (authData?.user) {
            authorData = {
              id: event.created_by,
              full_name: authData.user.user_metadata?.full_name || 'Unknown User',
              avatar_url: authData.user.user_metadata?.avatar_url
            }
          }
        } catch (err) {
          // Try profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', event.created_by)
            .single()

          if (profile) {
            authorData = {
              id: event.created_by,
              full_name: profile.full_name || 'Unknown User',
              avatar_url: profile.avatar_url
            }
          }
        }

        return {
          ...event,
          author: authorData || {
            id: event.created_by,
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      })
    )

    return NextResponse.json({ events: eventsWithAuthors })
  } catch (error) {
    console.error('Fetch community events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}