import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

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

    // Fetch newsletters with author profiles
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select(`
        *,
        profiles:author_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching newsletters:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ newsletters: newsletters || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const supabase = await createServerSupabaseAdminClient()
    const body = await request.json()


    // Prepare newsletter data
    const newsletterData = {
      ...body,
      published_at: body.is_published ? new Date().toISOString() : null
    }

    // Create newsletter
    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .insert(newsletterData)
      .select()
      .single()

    if (error) {
      console.error('Error creating newsletter:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logAdminActivity('create_newsletter', 'newsletter', newsletter.id)

    return NextResponse.json({ newsletter })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}