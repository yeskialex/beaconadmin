import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const createCommunitySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
  is_private: z.boolean(),
  is_active: z.boolean(),
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
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    // Use admin client to bypass RLS
    const supabase = await createServerSupabaseAdminClient()

    // Use a default system user ID for admin-created communities
    // You can replace this with a specific system user ID if needed
    const systemUserId = '2e393a2a-30cc-42f4-b415-c2645fba0078' // Using an existing user as system user

    // Create community
    const { data: community, error: createError } = await supabase
      .from('communities')
      .insert({
        ...data,
        creator_id: systemUserId, // Use system user as creator for admin-created communities
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

    const supabase = await createServerSupabaseClient()
    
    // Fetch communities
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        universities(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching communities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch communities' },
        { status: 500 }
      )
    }

    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Fetch communities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}