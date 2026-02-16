import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity, isSuperAdmin } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const createBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  image_url: z.string().url('Valid image URL is required'),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0),
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

    // Only super admins can create banners
    if (!isSuperAdmin(admin)) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = createBannerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Create banner
    const { data: banner, error: createError } = await supabase
      .from('banners')
      .insert({
        ...data,
        created_by: admin.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating banner:', createError)
      return NextResponse.json(
        { error: 'Failed to create banner' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'banner_created',
      'banners',
      banner.id,
      { title: banner.title }
    )

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Create banner error:', error)
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

    // Only super admins can view banners management
    if (!isSuperAdmin(admin)) {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let query = supabase
      .from('banners')
      .select(`
        *,
        admin_users!banners_created_by_fkey(full_name, email)
      `)

    // Filter by active status unless specifically requesting inactive ones
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    query = query.order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    const { data: banners, error } = await query

    if (error) {
      console.error('Error fetching banners:', error)
      return NextResponse.json(
        { error: 'Failed to fetch banners' },
        { status: 500 }
      )
    }

    return NextResponse.json({ banners: banners || [] })
  } catch (error) {
    console.error('Fetch banners error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}