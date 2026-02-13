import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'

export async function GET() {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Build query - filter by assigned communities for community admins
    let query = supabase
      .from('community_posts')
      .select(`
        *,
        communities(name)
      `)

    // If community admin, only show posts from their assigned communities
    if (!isSuperAdmin(admin) && admin.assigned_communities) {
      query = query.in('community_id', admin.assigned_communities)
    }

    const { data: posts, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Get unique author IDs and fetch profiles
    if (posts && posts.length > 0) {
      const authorIds = [...new Set(posts.map(post => post.author_id).filter(Boolean))]

      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', authorIds)

        // Map profiles to posts
        const postsWithProfiles = posts.map(post => ({
          ...post,
          profiles: profiles?.find(profile => profile.id === post.author_id) || null
        }))

        return NextResponse.json({ posts: postsWithProfiles })
      }
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Fetch posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}