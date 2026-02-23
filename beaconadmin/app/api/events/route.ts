import { NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'

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

    const supabase = await createServerSupabaseAdminClient()

    // Build query - filter by assigned communities for community admins
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        communities(name),
        event_categories(name, color_hex)
      `)

    // If community admin, only show events from their assigned communities
    // Super admins see ALL events (both community and personal events)
    if (!isSuperAdmin(admin) && admin.assigned_communities && admin.assigned_communities.length > 0) {
      query = query.in('community_id', admin.assigned_communities)
    } else if (!isSuperAdmin(admin)) {
      // Community admin with no assigned communities - show no events
      query = query.eq('id', 'no-match')
    }
    // For super admin: no filtering, show all events

    const { data: events, error } = await query
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
      } else {
        // No creator IDs found, but we still have events - return them without profile data
        const eventsWithProfiles = events.map(event => ({
          ...event,
          profiles: null
        }))
        return NextResponse.json({ events: eventsWithProfiles })
      }
    }

    // No events found
    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Fetch events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      start_time,
      end_time,
      location,
      is_community_event,
      is_private,
      community_id,
      category_id,
      remind_me,
      reminder_time
    } = body

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    // Validate community event requirements
    if (is_community_event && !community_id) {
      return NextResponse.json(
        { error: 'Community ID is required for community events' },
        { status: 400 }
      )
    }

    // Check authorization for community events
    if (is_community_event && community_id) {
      if (!isSuperAdmin(admin)) {
        // Community admin can only create events for assigned communities
        if (!admin.assigned_communities || !admin.assigned_communities.includes(community_id)) {
          return NextResponse.json(
            { error: 'You are not authorized to create events for this community' },
            { status: 403 }
          )
        }
      }
    }

    const supabase = await createServerSupabaseAdminClient()

    // Create the event
    const eventData = {
      title,
      description: description || null,
      start_time,
      end_time,
      location: location || null,
      is_community_event: is_community_event || false,
      is_private: is_private || false,
      community_id: is_community_event ? community_id : null,
      category_id: category_id || null,
      created_by: '2e393a2a-30cc-42f4-b415-c2645fba0078', // Using yeskialex@gmail.com's user ID
      remind_me: remind_me || false,
      reminder_time: reminder_time || null
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert(eventData)
      .select(`
        *,
        communities(name),
        event_categories(name, color_hex)
      `)
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    // Fetch creator profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', '2e393a2a-30cc-42f4-b415-c2645fba0078')
      .single()

    const eventWithProfile = {
      ...event,
      profiles: profile || null
    }

    return NextResponse.json({
      event: eventWithProfile,
      message: 'Event created successfully'
    })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}