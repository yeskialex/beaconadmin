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

    const { id: communityId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch join applications
    const { data: requests, error } = await supabase
      .from('community_join_applications')
      .select('*')
      .eq('community_id', communityId)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error fetching join applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch join applications' },
        { status: 500 }
      )
    }

    // For now, we'll fetch user profiles from the profiles table instead of auth.users
    // This is simpler and doesn't require admin auth API
    const userIds = requests?.map(r => r.user_id) || []

    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      profiles = profilesData || []
    }

    // Also try to get emails from auth.users if we have admin access
    const transformedRequests = await Promise.all((requests || []).map(async (request) => {
      const profile = profiles.find(p => p.id === request.user_id)

      // Try to get auth user data if available
      let authUserData = null
      try {
        const { data: authData } = await supabase.auth.admin.getUserById(request.user_id)
        if (authData?.user) {
          authUserData = {
            email: authData.user.email,
            user_metadata: authData.user.user_metadata
          }
        }
      } catch (err) {
        // If admin auth fails, we'll use profile data
        console.log('Could not fetch auth user data, using profile data')
      }

      return {
        ...request,
        user: {
          id: request.user_id,
          email: authUserData?.email || profile?.email || 'Unknown',
          user_metadata: {
            full_name: profile?.full_name || authUserData?.user_metadata?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || authUserData?.user_metadata?.avatar_url || null
          }
        }
      }
    }))

    return NextResponse.json({ requests: transformedRequests })
  } catch (error) {
    console.error('Fetch join applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}