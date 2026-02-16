import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
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
    const { userId } = await request.json()

    // Update join application status to accepted
    const { error: updateError } = await supabase
      .from('community_join_applications')
      .update({
        status: 'accepted',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.applicationId)

    if (updateError) {
      console.error('Error updating join application:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Add user to community members
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: resolvedParams.id,
        user_id: userId,
        role: 'user'
      })

    if (memberError) {
      // Check if user is already a member
      if (memberError.code !== '23505') { // Unique violation
        console.error('Error adding member:', memberError)
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }
    }

    // Log activity
    await logAdminActivity('approve_application', 'community_join_application', resolvedParams.applicationId, {
      community_id: resolvedParams.id,
      user_id: userId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}