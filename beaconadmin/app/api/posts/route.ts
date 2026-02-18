import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(10),
  community_id: z.string().min(1),
  is_official: z.boolean().optional().default(false),
  is_pinned: z.boolean().optional().default(false),
  media_urls: z.array(z.string()).optional().nullable(),
  author_nickname: z.string().optional(),
})

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

export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = createPostSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Use system user ID for admin posts
    const systemUserId = process.env.SYSTEM_USER_ID
    if (!systemUserId) {
      return NextResponse.json(
        { error: 'System configuration error: SYSTEM_USER_ID not configured' },
        { status: 500 }
      )
    }

    // Create the post
    const { data: post, error: createError } = await supabase
      .from('community_posts')
      .insert({
        title: data.title,
        content: data.content,
        community_id: data.community_id,
        author_id: systemUserId,
        is_official: data.is_official || true, // Default to true for admin posts
        is_pinned: data.is_pinned || false,
        media_urls: data.media_urls,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating post:', createError)
      return NextResponse.json(
        { error: 'Failed to create post', details: createError.message },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'post_created',
      'community_posts',
      post.id,
      {
        title: post.title,
        community_id: post.community_id,
        is_official: post.is_official,
        is_pinned: post.is_pinned,
        created_by: admin.id
      }
    )

    return NextResponse.json({
      post,
      message: 'Post created successfully!'
    })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}