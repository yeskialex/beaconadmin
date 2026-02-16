import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    const { data: terms, error } = await supabase
      .from('terms_and_conditions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching terms and conditions:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ terms })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('=== TERMS UPDATE DEBUG START ===')
  console.log('1. Params ID:', id)

  try {
    // Validate admin session
    console.log('2. Validating admin session...')
    const admin = await validateAdminSession()
    if (!admin) {
      console.log('2a. No admin session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('2b. Admin validated:', admin.email, 'Role:', admin.role)

    // Only super admins can update terms and conditions
    if (admin.role !== 'super_admin') {
      console.log('3. Admin is not super_admin')
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    console.log('4. Parsing request body...')
    const body = await request.json()
    console.log('4a. Body received:', JSON.stringify(body, null, 2))

    console.log('5. Creating Supabase client...')
    const supabase = await createServerSupabaseAdminClient()

    console.log('6. Preparing update data...')
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }
    console.log('6a. Update data:', JSON.stringify(updateData, null, 2))

    // Update terms and conditions
    console.log('7. Executing Supabase update...')
    const { data: terms, error } = await supabase
      .from('terms_and_conditions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('8. Supabase update error:', error)
      console.error('8a. Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('9. Update successful, terms:', JSON.stringify(terms, null, 2))

    // Log activity - wrap in try/catch to prevent it from breaking the update
    try {
      console.log('10. Logging admin activity...')
      await logAdminActivity('update_terms_conditions', 'terms_conditions', id)
      console.log('10a. Activity logged successfully')
    } catch (logError) {
      console.error('10b. Error logging activity:', logError)
      // Don't fail the request if logging fails
    }

    console.log('11. Returning success response')
    console.log('=== TERMS UPDATE DEBUG END ===')
    return NextResponse.json({ terms })
  } catch (error) {
    console.error('=== UNEXPECTED ERROR IN TERMS UPDATE ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    console.error('=== END ERROR DETAILS ===')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only super admins can delete terms and conditions
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Get terms details before deletion for logging
    const { data: terms } = await supabase
      .from('terms_and_conditions')
      .select('title, type')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('terms_and_conditions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting terms and conditions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await logAdminActivity('delete_terms_conditions', 'terms_conditions', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}