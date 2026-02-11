import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    // Step 1: Check admin
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Get params
    const { id: communityId, requestId } = await params

    // Step 3: Get body
    const { action } = await request.json()

    // Step 4: Create supabase client
    const supabase = await createServerSupabaseAdminClient()

    // Step 5: Simple update test
    const { data, error } = await supabase
      .from('community_join_applications')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    return NextResponse.json({
      error: 'Caught exception',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name
    }, { status: 500 })
  }
}