import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const supabase = await createServerSupabaseAdminClient()

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'pending'

    // Build query for join requests
    let query = supabase
      .from('community_join_requests')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url,
          user_name
        )
      `)
      .eq('community_id', params.id)
      .order('requested_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data: joinRequests, error: joinError } = await query

    if (joinError) {
      console.error('Error fetching join requests:', joinError)
      return NextResponse.json({ error: joinError.message }, { status: 500 })
    }

    // Get join applications with answers
    const userIds = joinRequests?.map(req => req.user_id) || []

    if (userIds.length > 0) {
      const { data: applications, error: appError } = await supabase
        .from('community_join_applications')
        .select('*')
        .eq('community_id', params.id)
        .in('user_id', userIds)

      if (appError) {
        console.error('Error fetching applications:', appError)
      }

      // Merge application data with join requests
      const mergedData = joinRequests?.map(request => {
        const application = applications?.find(app => app.user_id === request.user_id)
        return {
          ...request,
          answers: application?.answers || [],
          agreed_to_guidelines: application?.agreed_to_guidelines || false
        }
      })

      return NextResponse.json({ applications: mergedData || [] })
    }

    return NextResponse.json({ applications: joinRequests || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}