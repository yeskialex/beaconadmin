import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

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

    const supabase = await createServerSupabaseAdminClient()

    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .select(`
        *,
        profiles:author_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching newsletter:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ newsletter })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

    const supabase = await createServerSupabaseAdminClient()
    const body = await request.json()

    // Update newsletter
    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating newsletter:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logAdminActivity(admin.id, 'update_newsletter', 'newsletter', params.id, {
      changes: Object.keys(body)
    })

    return NextResponse.json({ newsletter })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const supabase = await createServerSupabaseAdminClient()

    // Get newsletter details before deletion for logging
    const { data: newsletter } = await supabase
      .from('newsletters')
      .select('title')
      .eq('id', params.id)
      .single()

    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting newsletter:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logAdminActivity(admin.id, 'delete_newsletter', 'newsletter', params.id, {
      title: newsletter?.title
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}