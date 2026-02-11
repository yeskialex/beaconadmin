import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, canAssignCommunities } from '@/lib/auth/auth-utils'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'

// Update community assignments for a community admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdminSession()
    if (!admin || !canAssignCommunities(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: communityAdminId } = await params
    const body = await request.json()
    const { community_ids } = body

    // Validate input
    if (!Array.isArray(community_ids)) {
      return NextResponse.json(
        { error: 'community_ids must be an array' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Verify the community admin exists
    const { data: communityAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', communityAdminId)
      .eq('role', 'community_admin')
      .single()

    if (adminError || !communityAdmin) {
      return NextResponse.json(
        { error: 'Community admin not found' },
        { status: 404 }
      )
    }

    // Get current assignments
    const { data: currentAssignments } = await supabase
      .from('admin_community_assignments')
      .select('community_id')
      .eq('admin_id', communityAdminId)

    const currentCommunityIds = currentAssignments?.map(a => a.community_id) || []

    // Find communities to add and remove
    const toAdd = community_ids.filter(id => !currentCommunityIds.includes(id))
    const toRemove = currentCommunityIds.filter(id => !community_ids.includes(id))

    // Remove old assignments
    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('admin_community_assignments')
        .delete()
        .eq('admin_id', communityAdminId)
        .in('community_id', toRemove)

      if (removeError) {
        console.error('Error removing assignments:', removeError)
        return NextResponse.json(
          { error: 'Failed to remove old assignments' },
          { status: 500 }
        )
      }
    }

    // Add new assignments
    const newAssignments = []
    if (toAdd.length > 0) {
      const assignmentsToInsert = toAdd.map(communityId => ({
        admin_id: communityAdminId,
        community_id: communityId,
        assigned_by: admin.id
      }))

      const { data: insertedAssignments, error: insertError } = await supabase
        .from('admin_community_assignments')
        .insert(assignmentsToInsert)
        .select('*, communities(name)')

      if (insertError) {
        console.error('Error adding assignments:', insertError)
        return NextResponse.json(
          { error: 'Failed to add new assignments' },
          { status: 500 }
        )
      }

      newAssignments.push(...(insertedAssignments || []))
    }

    // Log the activity
    await supabase.from('admin_activity_logs').insert({
      admin_user_id: admin.id,
      action: 'community_assignments_updated',
      entity_type: 'admin_users',
      entity_id: communityAdminId,
      details: {
        admin_email: communityAdmin.email,
        added_communities: toAdd,
        removed_communities: toRemove,
        total_assignments: community_ids.length
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Community assignments updated successfully',
      assignments: newAssignments,
      summary: {
        added: toAdd.length,
        removed: toRemove.length,
        total: community_ids.length
      }
    })
  } catch (error) {
    console.error('Update assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get assignments for a community admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await validateAdminSession()
    if (!admin || !canAssignCommunities(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: communityAdminId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // Get assignments for the community admin
    const { data: assignments, error } = await supabase
      .from('admin_community_assignments')
      .select(`
        community_id,
        assigned_at,
        communities(
          id,
          name,
          member_count,
          is_active
        )
      `)
      .eq('admin_id', communityAdminId)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assignments: assignments || []
    })
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}