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

    // Fetch community posts
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching community posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Get author information for each post
    const postsWithAuthors = await Promise.all(
      (posts || []).map(async (post) => {
        let authorData = null
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(post.author_id)
          if (authData?.user) {
            authorData = {
              id: post.author_id,
              full_name: authData.user.user_metadata?.full_name || 'Unknown User',
              avatar_url: authData.user.user_metadata?.avatar_url
            }
          }
        } catch (err) {
          // Try profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', post.author_id)
            .single()

          if (profile) {
            authorData = {
              id: post.author_id,
              full_name: profile.full_name || 'Unknown User',
              avatar_url: profile.avatar_url
            }
          }
        }

        return {
          ...post,
          author: authorData || {
            id: post.author_id,
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      })
    )

    return NextResponse.json({ posts: postsWithAuthors })
  } catch (error) {
    console.error('Fetch community posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}