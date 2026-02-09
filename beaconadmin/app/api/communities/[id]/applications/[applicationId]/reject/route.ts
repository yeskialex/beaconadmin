import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; applicationId: string } }
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
    const { rejection_reason } = await request.json()

    // Update join request status to declined
    const { error: updateError } = await supabase
      .from('community_join_requests')
      .update({
        status: 'declined',
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        rejection_reason: rejection_reason
      })
      .eq('id', params.applicationId)

    if (updateError) {
      console.error('Error updating join request:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log activity
    await logAdminActivity(admin.id, 'reject_application', 'community_join_request', params.applicationId, {
      community_id: params.id,
      rejection_reason: rejection_reason
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}