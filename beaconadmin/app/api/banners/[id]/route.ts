import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity, isSuperAdmin } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const updateBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less').optional(),
  description: z.string().optional(),
  image_url: z.string().url('Valid image URL is required').optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only super admins can view banners
    if (!isSuperAdmin(admin)) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    const { data: banner, error } = await supabase
      .from('banners')
      .select(`
        *,
        admin_users!banners_created_by_fkey(full_name, email)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching banner:', error)
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Fetch banner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only super admins can update banners
    if (!isSuperAdmin(admin)) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = updateBannerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Check if banner exists
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    // Update banner
    const updateData: any = { ...data }

    const { data: banner, error: updateError } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating banner:', updateError)
      return NextResponse.json(
        { error: 'Failed to update banner' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'banner_updated',
      'banners',
      banner.id,
      { title: banner.title, changes: Object.keys(data) }
    )

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Update banner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only super admins can delete banners
    if (!isSuperAdmin(admin)) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Check if banner exists
    const { data: existingBanner, error: fetchError } = await supabase
      .from('banners')
      .select('title')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    // Delete banner
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting banner:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete banner' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'banner_deleted',
      'banners',
      params.id,
      { title: existingBanner.title }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete banner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}