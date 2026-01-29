import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
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

    const { id: postId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch post with author and community information
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select(`
        *,
        community:community_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Fetch author information
    let authorData = null
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(post.author_id)
      if (authData?.user) {
        authorData = {
          id: post.author_id,
          email: authData.user.email,
          full_name: authData.user.user_metadata?.full_name || 'Unknown User',
          avatar_url: authData.user.user_metadata?.avatar_url
        }
      }
    } catch (err) {
      // Try to get from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', post.author_id)
        .single()

      if (profile) {
        authorData = {
          id: post.author_id,
          email: profile.email || 'Unknown',
          full_name: profile.full_name || 'Unknown User',
          avatar_url: profile.avatar_url
        }
      }
    }

    if (!authorData) {
      authorData = {
        id: post.author_id,
        email: 'Unknown',
        full_name: 'Unknown User',
        avatar_url: null
      }
    }

    // Fetch comments (optional - can be added later)
    const { data: comments } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        user_id
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    // Get comment authors
    const commentsWithAuthors = await Promise.all(
      (comments || []).map(async (comment) => {
        let commentAuthor = null
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(comment.user_id)
          if (authData?.user) {
            commentAuthor = {
              id: comment.user_id,
              full_name: authData.user.user_metadata?.full_name || 'Unknown User',
              avatar_url: authData.user.user_metadata?.avatar_url
            }
          }
        } catch (err) {
          // Try profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', comment.user_id)
            .single()

          if (profile) {
            commentAuthor = {
              id: comment.user_id,
              full_name: profile.full_name || 'Unknown User',
              avatar_url: profile.avatar_url
            }
          }
        }

        return {
          ...comment,
          author: commentAuthor || {
            id: comment.user_id,
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      })
    )

    const postDetail = {
      ...post,
      author: authorData,
      comments: commentsWithAuthors
    }

    return NextResponse.json({ post: postDetail })
  } catch (error) {
    console.error('Fetch post detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Use admin client to bypass RLS
    const supabase = await createServerSupabaseAdminClient()
    const { id: postId } = await params

    // Mark post as deleted (soft delete)
    const { error } = await supabase
      .from('community_posts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', postId)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'post_deleted',
      'community_posts',
      postId,
      { deleted_by: admin.id }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    // Use admin client to bypass RLS
    const supabase = await createServerSupabaseAdminClient()
    const { id: postId } = await params

    // Update post (for pinning, marking official, etc.)
    const { error } = await supabase
      .from('community_posts')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'post_updated',
      'community_posts',
      postId,
      { updates: body, updated_by: admin.id }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}