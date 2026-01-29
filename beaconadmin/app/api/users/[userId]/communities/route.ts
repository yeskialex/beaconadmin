import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch user's community memberships
    const { data: memberships, error } = await supabase
      .from('community_members')
      .select(`
        role,
        joined_at,
        community:community_id (
          id,
          name,
          description,
          avatar_url,
          is_private,
          member_count
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching user communities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch communities' },
        { status: 500 }
      )
    }

    // Transform the data to flatten community information
    const communities = (memberships || []).map(membership => ({
      id: membership.community.id,
      name: membership.community.name,
      description: membership.community.description,
      avatar_url: membership.community.avatar_url,
      is_private: membership.community.is_private,
      member_count: membership.community.member_count,
      role: membership.role,
      joined_at: membership.joined_at
    }))

    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Fetch user communities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}