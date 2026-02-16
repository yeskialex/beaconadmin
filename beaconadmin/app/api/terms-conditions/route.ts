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

    // Only super admins can access terms and conditions
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Fetch all terms and conditions
    const { data: termsConditions, error } = await supabase
      .from('terms_and_conditions')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching terms and conditions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ termsConditions: termsConditions || [] })
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

    // Only super admins can create terms and conditions
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()
    const body = await request.json()

    // Prepare terms and conditions data
    const termsData = {
      type: body.type,
      title: body.title,
      content: body.content,
      version: body.version || '1.0',
      is_required: body.is_required || false,
      is_active: body.is_active !== undefined ? body.is_active : true,
      display_order: body.display_order || 0
    }

    // Create terms and conditions
    const { data: terms, error } = await supabase
      .from('terms_and_conditions')
      .insert(termsData)
      .select()
      .single()

    if (error) {
      console.error('Error creating terms and conditions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logAdminActivity('create_terms_conditions', 'terms_conditions', terms.id)

    return NextResponse.json({ terms })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}