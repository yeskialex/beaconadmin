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