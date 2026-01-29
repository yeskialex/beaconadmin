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

    const { id: communityId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Fetch single community
    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single()

    if (error) {
      console.error('Error fetching community:', error)
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ community })
  } catch (error) {
    console.error('Fetch community error:', error)
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
    const { id: communityId } = await params

    // Get community details before deletion for logging
    const { data: community } = await supabase
      .from('communities')
      .select('name')
      .eq('id', communityId)
      .single()

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Start transaction-like deletions (Supabase will handle foreign key constraints)
    // Delete in proper order to avoid constraint violations

    // 1. Delete post comments for all posts in this community
    const { error: commentsError } = await supabase
      .from('post_comments')
      .delete()
      .in('post_id',
        supabase
          .from('community_posts')
          .select('id')
          .eq('community_id', communityId)
      )

    if (commentsError) {
      console.error('Error deleting post comments:', commentsError)
      // Continue with deletion even if comments fail
    }

    // 2. Delete post likes for all posts in this community
    const { error: likesError } = await supabase
      .from('post_likes')
      .delete()
      .in('post_id',
        supabase
          .from('community_posts')
          .select('id')
          .eq('community_id', communityId)
      )

    if (likesError) {
      console.error('Error deleting post likes:', likesError)
      // Continue with deletion even if likes fail
    }

    // 3. Delete all posts in this community
    const { error: postsError } = await supabase
      .from('community_posts')
      .delete()
      .eq('community_id', communityId)

    if (postsError) {
      console.error('Error deleting community posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to delete community posts' },
        { status: 500 }
      )
    }

    // 4. Delete all events in this community
    const { error: eventsError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('community_id', communityId)

    if (eventsError) {
      console.error('Error deleting community events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to delete community events' },
        { status: 500 }
      )
    }

    // 5. Delete community join requests
    const { error: joinRequestsError } = await supabase
      .from('community_join_requests')
      .delete()
      .eq('community_id', communityId)

    if (joinRequestsError) {
      console.error('Error deleting join requests:', joinRequestsError)
      // Continue with deletion
    }

    // 6. Delete community members
    const { error: membersError } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)

    if (membersError) {
      console.error('Error deleting community members:', membersError)
      return NextResponse.json(
        { error: 'Failed to delete community members' },
        { status: 500 }
      )
    }

    // 7. Finally, delete the community itself
    const { error: communityError } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (communityError) {
      console.error('Error deleting community:', communityError)
      return NextResponse.json(
        { error: 'Failed to delete community' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'community_deleted',
      'communities',
      communityId,
      {
        community_name: community.name,
        deleted_by: admin.id,
        cascade_delete: true
      }
    )

    return NextResponse.json({
      success: true,
      message: `Community "${community.name}" and all related data deleted successfully`
    })
  } catch (error) {
    console.error('Delete community error:', error)
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
    const { id: communityId } = await params

    // Update community
    const { error } = await supabase
      .from('communities')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', communityId)

    if (error) {
      console.error('Error updating community:', error)
      return NextResponse.json(
        { error: 'Failed to update community' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'community_updated',
      'communities',
      communityId,
      { updates: body, updated_by: admin.id }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update community error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { id: communityId } = await params

    // Update community
    const { error } = await supabase
      .from('communities')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', communityId)

    if (error) {
      console.error('Error updating community:', error)
      return NextResponse.json(
        { error: 'Failed to update community' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'community_updated',
      'communities',
      communityId,
      { updates: body, updated_by: admin.id }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update community error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}