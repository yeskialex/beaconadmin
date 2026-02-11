import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
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

    const resolvedParams = await params
    const supabase = await createServerSupabaseAdminClient()

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'pending'

    // Build query for join applications
    let query = supabase
      .from('community_join_applications')
      .select('*')
      .eq('community_id', resolvedParams.id)
      .order('requested_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data: joinApplications, error: joinError } = await query

    if (joinError) {
      console.error('Error fetching join applications:', joinError)
      return NextResponse.json({ error: joinError.message }, { status: 500 })
    }

    // Get profile data for each application
    if (joinApplications && joinApplications.length > 0) {
      const userIds = joinApplications.map(app => app.user_id)

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, user_name')
        .in('id', userIds)

      if (profileError) {
        console.error('Error fetching profiles:', profileError)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // Merge profile data with applications
      const applicationsWithProfiles = joinApplications.map(app => ({
        ...app,
        profiles: profiles?.find(profile => profile.id === app.user_id) || null
      }))

      return NextResponse.json({ applications: applicationsWithProfiles })
    }

    return NextResponse.json({ applications: [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}