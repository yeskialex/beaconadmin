import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, isSuperAdmin, isCommunityAdmin } from '@/lib/auth/auth-utils'

export async function GET(request: NextRequest) {
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
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build the base query - join with profiles table via user_id
    let query = supabase
      .from('community_join_applications')
      .select(`
        id,
        community_id,
        user_id,
        answers,
        agreed_to_guidelines,
        submitted_at,
        rejection_reason,
        reviewed_at,
        status,
        created_at,
        communities!inner (
          id,
          name,
          avatar_url
        )
      `)
      .eq('status', status)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by assigned communities for community admins
    if (isCommunityAdmin(admin) && admin.assigned_communities) {
      query = query.in('community_id', admin.assigned_communities)
    }
    // Super admins see all applications

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Fetch user profiles separately
    let profiles: Record<string, any> = {}
    if (applications && applications.length > 0) {
      const userIds = applications.map(app => app.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, user_name')
        .in('id', userIds)

      if (profilesData) {
        profiles = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Transform the data to a cleaner format
    const transformedApplications = applications?.map(app => {
      const profile = profiles[app.user_id] || {}
      return {
        id: app.id,
        communityId: app.community_id,
        userId: app.user_id,
        answers: app.answers,
        agreedToGuidelines: app.agreed_to_guidelines,
        submittedAt: app.submitted_at,
        rejectionReason: app.rejection_reason,
        reviewedAt: app.reviewed_at,
        status: app.status,
        createdAt: app.created_at,
        community: {
          id: app.communities.id,
          name: app.communities.name,
          avatarUrl: app.communities.avatar_url
        },
        applicant: {
          id: app.user_id,
          fullName: profile.full_name || profile.user_name || 'Unknown User',
          email: profile.email || 'No email',
          avatarUrl: profile.avatar_url
        }
      }
    }) || []

    return NextResponse.json({
      applications: transformedApplications,
      total: count || 0
    })
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}