import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'
import { z } from 'zod'

const updateNoticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title must be 255 characters or less').optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  community_id: z.string().uuid('Valid community ID is required').optional(),
  images: z.array(z.string()).optional()
})

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

    const resolvedParams = await params
    const supabase = await createServerSupabaseAdminClient()

    const { data: notice, error } = await supabase
      .from('community_notices')
      .select(`
        *,
        communities(name)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      console.error('Error fetching notice:', error)
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      )
    }

    // Check if admin has access to this notice's community
    if (!isSuperAdmin(admin)) {
      if (!admin.assigned_communities?.includes(notice.community_id)) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have access to this notice' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Fetch notice error:', error)
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

    const resolvedParams = await params
    const body = await request.json()

    // Validate input
    const validationResult = updateNoticeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Check if notice exists and get its community_id
    const { data: existingNotice, error: fetchError } = await supabase
      .from('community_notices')
      .select('community_id, title')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      )
    }

    // Check if admin has access to this notice's community
    if (!isSuperAdmin(admin)) {
      if (!admin.assigned_communities?.includes(existingNotice.community_id)) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have access to this notice' },
          { status: 403 }
        )
      }
    }

    // Update notice
    const { data: notice, error: updateError } = await supabase
      .from('community_notices')
      .update(data)
      .eq('id', resolvedParams.id)
      .select(`
        *,
        communities(name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating notice:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notice' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'notice_updated',
      'community_notices',
      notice.id,
      {
        title: notice.title,
        changes: Object.keys(data)
      }
    )

    return NextResponse.json({ notice })
  } catch (error) {
    console.error('Update notice error:', error)
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

    const resolvedParams = await params
    const supabase = await createServerSupabaseAdminClient()

    // Check if notice exists and get its details
    const { data: existingNotice, error: fetchError } = await supabase
      .from('community_notices')
      .select('community_id, title')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      )
    }

    // Check if admin has access to this notice's community
    if (!isSuperAdmin(admin)) {
      if (!admin.assigned_communities?.includes(existingNotice.community_id)) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have access to this notice' },
          { status: 403 }
        )
      }
    }

    // Delete notice
    const { error: deleteError } = await supabase
      .from('community_notices')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error('Error deleting notice:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete notice' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'notice_deleted',
      'community_notices',
      resolvedParams.id,
      { title: existingNotice.title }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}