import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity, isSuperAdmin, isCommunityAdmin } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const createCommunitySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
  is_private: z.boolean(),
  is_active: z.boolean(),
  is_default: z.boolean(),
  scope: z.enum(['global', 'institutional']),
  university_id: z.string().optional().nullable(),
})

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
    const validationResult = createCommunitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data
    // Use admin client to bypass RLS
    const supabase = await createServerSupabaseAdminClient()

    // Use a default system user ID for admin-created communities
    const systemUserId = process.env.SYSTEM_USER_ID
    if (!systemUserId) {
      return NextResponse.json(
        { error: 'System configuration error: SYSTEM_USER_ID not configured' },
        { status: 500 }
      )
    }

    // Create community
    const { data: community, error: createError } = await supabase
      .from('communities')
      .insert({
        ...data,
        creator_id: systemUserId, // Use system user as creator for admin-created communities
        created_by_admin_id: admin.id, // Track which admin created it
        avatar_url: data.avatar_url || null,
        cover_url: data.cover_url || null,
        university_id: data.scope === 'global' ? null : data.university_id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating community:', createError)
      return NextResponse.json(
        { error: 'Failed to create community' },
        { status: 500 }
      )
    }

    // If created by community admin, auto-assign them to the community
    if (isCommunityAdmin(admin)) {
      const { error: assignError } = await supabase
        .from('admin_community_assignments')
        .insert({
          admin_id: admin.id,
          community_id: community.id,
          assigned_by: admin.id // Self-assignment for created communities
        })

      if (assignError) {
        console.error('Error auto-assigning community:', assignError)
        // Don't fail the creation, just log the error
      }
    }

    // Log the activity
    await logAdminActivity(
      'community_created',
      'communities',
      community.id,
      { name: community.name }
    )

    return NextResponse.json({ community })
  } catch (error) {
    console.error('Create community error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const supabase = await createServerSupabaseAdminClient()

    let query = supabase
      .from('communities')
      .select(`
        *,
        universities(name),
        admin_users!communities_created_by_admin_id_fkey(id, email, full_name, role)
      `)

    // Filter based on admin role
    if (isSuperAdmin(admin)) {
      // Super admins see all communities
      query = query.order('created_at', { ascending: false })
    } else if (isCommunityAdmin(admin)) {
      // Community admins only see their assigned communities
      const assignedCommunityIds = admin.assigned_communities || []

      if (assignedCommunityIds.length === 0) {
        // No assigned communities
        return NextResponse.json({ communities: [] })
      }

      query = query
        .in('id', assignedCommunityIds)
        .order('created_at', { ascending: false })
    } else {
      // Unknown role, no access
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: communities, error } = await query

    if (error) {
      console.error('Error fetching communities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch communities' },
        { status: 500 }
      )
    }

    // Transform communities to include proper creator display names
    const transformedCommunities = (communities || []).map(community => ({
      ...community,
      creator_display_name: community.admin_users
        ? (community.admin_users.role === 'community_admin' ? 'Community Admin' : 'Admin')
        : 'System'
    }))

    return NextResponse.json({ communities: transformedCommunities })
  } catch (error) {
    console.error('Fetch communities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}