import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

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

    const { id: eventId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch event with community information
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select(`
        *,
        community:community_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Fetch creator information
    let authorData = null
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(event.created_by)
      if (authData?.user) {
        authorData = {
          id: event.created_by,
          email: authData.user.email,
          full_name: authData.user.user_metadata?.full_name || 'Unknown User',
          avatar_url: authData.user.user_metadata?.avatar_url
        }
      }
    } catch (err) {
      // Try to get from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', event.created_by)
        .single()

      if (profile) {
        authorData = {
          id: event.created_by,
          email: profile.email || 'Unknown',
          full_name: profile.full_name || 'Unknown User',
          avatar_url: profile.avatar_url
        }
      }
    }

    if (!authorData) {
      authorData = {
        id: event.created_by,
        email: 'Unknown',
        full_name: 'Unknown User',
        avatar_url: null
      }
    }

    // Fetch event attendees (if there's an event_attendees table)
    let attendees = []
    try {
      const { data: attendeesData } = await supabase
        .from('event_attendees')
        .select(`
          id,
          user_id,
          status,
          created_at
        `)
        .eq('event_id', eventId)

      if (attendeesData) {
        // Get attendee user information
        attendees = await Promise.all(
          attendeesData.map(async (attendee) => {
            let userData = null
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(attendee.user_id)
              if (authData?.user) {
                userData = {
                  id: attendee.user_id,
                  full_name: authData.user.user_metadata?.full_name || 'Unknown User',
                  avatar_url: authData.user.user_metadata?.avatar_url
                }
              }
            } catch (err) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', attendee.user_id)
                .single()

              if (profile) {
                userData = {
                  id: attendee.user_id,
                  full_name: profile.full_name || 'Unknown User',
                  avatar_url: profile.avatar_url
                }
              }
            }

            return {
              ...attendee,
              user: userData || {
                id: attendee.user_id,
                full_name: 'Unknown User',
                avatar_url: null
              }
            }
          })
        )
      }
    } catch (err) {
      // Event attendees table might not exist
      console.log('Event attendees table not found or accessible')
    }

    const eventDetail = {
      ...event,
      author: authorData,
      attendees
    }

    return NextResponse.json({ event: eventDetail })
  } catch (error) {
    console.error('Fetch event detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Use admin client to bypass RLS
    const supabase = await createServerSupabaseAdminClient()
    const { id: eventId } = await params

    // Delete the event
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'event_deleted',
      'calendar_events',
      eventId,
      { deleted_by: admin.id }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    // Use admin client to bypass RLS
    const supabase = await createServerSupabaseAdminClient()
    const { id: eventId } = await params

    // Update event
    const { error } = await supabase
      .from('calendar_events')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'event_updated',
      'calendar_events',
      eventId,
      { updates: body, updated_by: admin.id }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}