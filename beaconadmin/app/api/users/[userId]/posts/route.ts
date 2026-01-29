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

    // Fetch user's posts with community information
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        created_at,
        is_pinned,
        is_deleted,
        like_count,
        comment_count,
        community:community_id (
          id,
          name
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Fetch user posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}