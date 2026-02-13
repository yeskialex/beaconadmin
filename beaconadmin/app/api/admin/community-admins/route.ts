import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, createCommunityAdmin, canCreateCommunityAdmin } from '@/lib/auth/auth-utils'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Get all community admins (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = await validateAdminSession()
    if (!admin || !canCreateCommunityAdmin(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Get all community admins with their assigned communities
    const { data: communityAdmins, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        email,
        full_name,
        is_active,
        created_at,
        last_login_at,
        must_change_password,
        admin_community_assignments!admin_community_assignments_admin_id_fkey(
          community_id,
          assigned_at,
          communities(
            id,
            name
          )
        )
      `)
      .eq('role', 'community_admin')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching community admins:', error)
      return NextResponse.json(
        { error: 'Failed to fetch community admins' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      communityAdmins: communityAdmins || []
    })
  } catch (error) {
    console.error('Get community admins error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new community admin (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdminSession()
    if (!admin || !canCreateCommunityAdmin(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, full_name, community_ids } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Check if email already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('base64url')

    // Create community admin
    const result = await createCommunityAdmin(
      email,
      tempPassword,
      full_name || null,
      admin.id
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create community admin' },
        { status: 500 }
      )
    }

    // Assign communities if provided
    const assignments = []
    if (community_ids && Array.isArray(community_ids) && community_ids.length > 0) {
      for (const communityId of community_ids) {
        const { data, error: assignError } = await supabase
          .from('admin_community_assignments')
          .insert({
            admin_id: result.id,
            community_id: communityId,
            assigned_by: admin.id
          })
          .select('*, communities(name)')
          .single()

        if (!assignError && data) {
          assignments.push(data)
        }
      }
    }

    // Log the activity
    await supabase.from('admin_activity_logs').insert({
      admin_user_id: admin.id,
      action: 'community_admin_created',
      entity_type: 'admin_users',
      entity_id: result.id,
      details: {
        email,
        full_name,
        assigned_communities: community_ids || [],
        temp_password_generated: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Community admin created successfully',
      admin: {
        id: result.id,
        email,
        full_name,
        tempPassword: result.tempPassword
      },
      assignments
    })
  } catch (error) {
    console.error('Create community admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete community admin (Super Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await validateAdminSession()
    if (!admin || !canCreateCommunityAdmin(admin)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { admin_id } = body

    // Validate required fields
    if (!admin_id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Verify the admin exists and is a community admin
    const { data: targetAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role, full_name')
      .eq('id', admin_id)
      .eq('role', 'community_admin')
      .single()

    if (adminError || !targetAdmin) {
      return NextResponse.json(
        { error: 'Community admin not found' },
        { status: 404 }
      )
    }

    // Prevent super admin from deleting themselves or other super admins
    if (targetAdmin.role === 'super_admin' || admin_id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete super admin accounts or your own account' },
        { status: 400 }
      )
    }

    // Get assigned communities before deletion for logging
    const { data: assignments } = await supabase
      .from('admin_community_assignments')
      .select('community_id, communities(name)')
      .eq('admin_id', admin_id)

    // Delete all related data in the correct order

    // 1. Delete admin sessions
    const { error: sessionsError } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('admin_user_id', admin_id)

    if (sessionsError) {
      console.error('Error deleting admin sessions:', sessionsError)
    }

    // 2. Delete community assignments
    const { error: assignmentsError } = await supabase
      .from('admin_community_assignments')
      .delete()
      .eq('admin_id', admin_id)

    if (assignmentsError) {
      console.error('Error deleting community assignments:', assignmentsError)
    }

    // 3. Delete activity logs (optional - may want to keep for audit trail)
    const { error: logsError } = await supabase
      .from('admin_activity_logs')
      .delete()
      .eq('admin_user_id', admin_id)

    if (logsError) {
      console.error('Error deleting activity logs:', logsError)
      // Continue even if this fails - logs are not critical for deletion
    }

    // 4. Finally, delete the admin user
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', admin_id)

    if (deleteError) {
      console.error('Error deleting admin user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete community admin account' },
        { status: 500 }
      )
    }

    // Log the deletion activity
    await supabase.from('admin_activity_logs').insert({
      admin_user_id: admin.id,
      action: 'community_admin_deleted',
      entity_type: 'admin_users',
      entity_id: admin_id,
      details: {
        deleted_admin_email: targetAdmin.email,
        deleted_admin_name: targetAdmin.full_name,
        assigned_communities: assignments?.map(a => ({
          id: a.community_id,
          name: a.communities?.name
        })) || [],
        deleted_by: admin.id,
        deleted_by_email: admin.email
      }
    })

    return NextResponse.json({
      success: true,
      message: `Community admin "${targetAdmin.email}" has been deleted successfully`,
      deleted_admin: {
        id: targetAdmin.id,
        email: targetAdmin.email,
        full_name: targetAdmin.full_name
      }
    })
  } catch (error) {
    console.error('Delete community admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}