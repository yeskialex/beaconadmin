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

    // Fetch community members
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching community members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    // Get user information for each member
    const membersWithUserData = await Promise.all(
      (members || []).map(async (member) => {
        let userData = null
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(member.user_id)
          if (authData?.user) {
            userData = {
              id: member.user_id,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || 'Unknown User',
              avatar_url: authData.user.user_metadata?.avatar_url
            }
          }
        } catch (err) {
          // Try profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', member.user_id)
            .single()

          if (profile) {
            userData = {
              id: member.user_id,
              email: profile.email || 'Unknown',
              full_name: profile.full_name || 'Unknown User',
              avatar_url: profile.avatar_url
            }
          }
        }

        return {
          ...member,
          user: userData || {
            id: member.user_id,
            email: 'Unknown',
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      })
    )

    return NextResponse.json({ members: membersWithUserData })
  } catch (error) {
    console.error('Fetch community members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}