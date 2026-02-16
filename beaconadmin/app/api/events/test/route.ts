import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'

export async function GET() {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json({
        error: 'No admin session',
        authenticated: false
      }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Test 1: Direct count of all events
    const { count: totalCount, error: countError } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })

    // Test 2: Get first 5 events without any filtering
    const { data: sampleEvents, error: sampleError } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, community_id')
      .limit(5)

    // Test 3: Check what the admin details are
    const adminInfo = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isSuperAdmin: isSuperAdmin(admin),
      assigned_communities: admin.assigned_communities
    }

    // Test 4: Try the full query as in the main events route
    let fullQuery = supabase
      .from('calendar_events')
      .select(`
        *,
        communities(name),
        event_categories(name, color_hex)
      `)

    // Apply same logic as main route
    if (!isSuperAdmin(admin) && admin.assigned_communities && admin.assigned_communities.length > 0) {
      fullQuery = fullQuery.in('community_id', admin.assigned_communities)
    } else if (!isSuperAdmin(admin)) {
      fullQuery = fullQuery.eq('id', 'no-match')
    }

    const { data: fullEvents, error: fullError } = await fullQuery
      .order('start_time', { ascending: true })

    return NextResponse.json({
      success: true,
      tests: {
        totalEventsInDB: totalCount,
        countError: countError?.message,
        sampleEvents: sampleEvents,
        sampleError: sampleError?.message,
        adminInfo: adminInfo,
        fullQueryCount: fullEvents?.length || 0,
        fullQueryError: fullError?.message,
        firstFullEvent: fullEvents?.[0] || null
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}