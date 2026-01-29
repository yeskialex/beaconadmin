import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET() {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Fetch events with additional info
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        communities(name),
        event_categories(name, color_hex)
      `)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    // Get unique creator IDs and fetch profiles
    if (events && events.length > 0) {
      const creatorIds = [...new Set(events.map(event => event.created_by).filter(Boolean))]

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', creatorIds)

        // Map profiles to events
        const eventsWithProfiles = events.map(event => ({
          ...event,
          profiles: profiles?.find(profile => profile.id === event.created_by) || null
        }))

        return NextResponse.json({ events: eventsWithProfiles })
      }
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Fetch events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}