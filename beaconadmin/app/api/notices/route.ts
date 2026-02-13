import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'
import { z } from 'zod'

const createNoticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title must be 255 characters or less'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  community_id: z.string().uuid('Valid community ID is required'),
  images: z.array(z.string()).optional()
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
    console.log('POST /api/notices - Request body:', JSON.stringify(body, null, 2))

    // Validate input
    const validationResult = createNoticeSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    console.log('Validated data:', JSON.stringify(data, null, 2))

    const supabase = await createServerSupabaseAdminClient()

    // Check if admin has access to this community
    if (!isSuperAdmin(admin)) {
      if (!admin.assigned_communities?.includes(data.community_id)) {
        console.error('Access denied for admin:', admin.id, 'to community:', data.community_id)
        return NextResponse.json(
          { error: 'Forbidden - You do not have access to this community' },
          { status: 403 }
        )
      }
    }

    // Data to insert
    const insertData = {
      title: data.title,
      content: data.content,
      community_id: data.community_id,
      created_by: admin.id,  // Admin ID from admin_users table
      images: data.images || []
    }
    console.log('Data to insert:', JSON.stringify(insertData, null, 2))

    // Create notice
    const { data: notice, error: createError } = await supabase
      .from('community_notices')
      .insert(insertData)
      .select(`
        *,
        communities(name)
      `)
      .single()

    if (createError) {
      console.error('Error creating notice - Full error:', JSON.stringify(createError, null, 2))
      console.error('Error details:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code
      })
      return NextResponse.json(
        { error: 'Failed to create notice', details: createError },
        { status: 500 }
      )
    }

    console.log('Notice created successfully:', JSON.stringify(notice, null, 2))

    // Log the activity
    await logAdminActivity(
      'notice_created',
      'community_notices',
      notice.id,
      {
        title: notice.title,
        community_id: data.community_id
      }
    )

    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Create notice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('community_id')

    const supabase = await createServerSupabaseAdminClient()

    // Build query
    let query = supabase
      .from('community_notices')
      .select(`
        *,
        communities(name)
      `)

    // Filter by community if specified
    if (communityId) {
      query = query.eq('community_id', communityId)
    }

    // Filter by assigned communities for community admins
    if (!isSuperAdmin(admin) && admin.assigned_communities) {
      query = query.in('community_id', admin.assigned_communities)
    }

    const { data: notices, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notices:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notices' },
        { status: 500 }
      )
    }

    // Transform notices to include proper creator display names
    const transformedNotices = (notices || []).map(notice => ({
      ...notice,
      creator_display_name: 'Admin'
    }))

    return NextResponse.json({ notices: transformedNotices })
  } catch (error) {
    console.error('Fetch notices error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}