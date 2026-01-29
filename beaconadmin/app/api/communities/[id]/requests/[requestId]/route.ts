import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { randomUUID } from 'crypto'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    console.log('Starting PATCH request for join request')

    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      console.log('No admin session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('Admin validated:', admin.id)

    const { id: communityId, requestId } = await params
    console.log('Processing request:', { communityId, requestId })

    const body = await request.json()
    const { action } = body
    console.log('Action requested:', action)

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()
    console.log('Supabase admin client created')

    // Get the join request details
    console.log('Fetching join request from database...')
    const { data: joinRequest, error: fetchError } = await supabase
      .from('community_join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('community_id', communityId)
      .single()

    if (fetchError) {
      console.error('Error fetching join request:', fetchError)
      return NextResponse.json(
        { error: 'Join request not found', details: fetchError.message },
        { status: 404 }
      )
    }

    if (!joinRequest) {
      console.log('Join request not found')
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      )
    }

    console.log('Join request found:', { id: joinRequest.id, status: joinRequest.status })

    if (joinRequest.status !== 'pending') {
      console.log('Request already processed:', joinRequest.status)
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // Update the join request status
    // Note: reviewed_by expects a UUID from auth.users, not admin_users
    // We'll use the system user ID for now
    const systemUserId = '2e393a2a-30cc-42f4-b415-c2645fba0078' // Same as used for creating communities

    console.log('Updating join request status to:', action)
    const updateData = {
      status: action === 'approve' ? 'accepted' : 'declined',
      reviewed_at: new Date().toISOString(),
      reviewed_by: systemUserId // Use system user ID since reviewed_by references auth.users
    }
    console.log('Update data:', updateData)

    const { data: updateResult, error: updateError } = await supabase
      .from('community_join_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()

    if (updateError) {
      console.error('Error updating join request:', updateError)
      console.error('Error details:', updateError.message, updateError.code)
      return NextResponse.json(
        { error: 'Failed to update join request', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('Join request updated successfully:', updateResult)

    // If approved, add user to community members
    if (action === 'approve') {
      // First check if user is already a member
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', joinRequest.user_id)
        .single()

      if (!existingMember) {
        // Generate a UUID for the new member record
        const memberId = randomUUID()
        console.log('Adding member with ID:', memberId)

        const { data: memberData, error: memberError } = await supabase
          .from('community_members')
          .insert({
            id: memberId,
            community_id: communityId,
            user_id: joinRequest.user_id,
            role: 'member',
            joined_at: new Date().toISOString()
          })
          .select()
          .single()

        if (memberError) {
          console.error('Error adding user to community:', memberError)
          console.error('Member data:', {
            community_id: communityId,
            user_id: joinRequest.user_id
          })

          // Still approve the request even if we can't add to members
          // This prevents the request from being stuck
        }
      } else {
        console.log('User is already a member of this community')
      }

      // Update community member count
      try {
        const { data: currentCommunity } = await supabase
          .from('communities')
          .select('member_count')
          .eq('id', communityId)
          .single()

        await supabase
          .from('communities')
          .update({
            member_count: (currentCommunity?.member_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', communityId)
      } catch (err) {
        console.log('Could not update member count:', err)
      }
    }

    // Log the activity
    await logAdminActivity(
      `join_request_${action}d`,
      'community_join_requests',
      requestId,
      {
        community_id: communityId,
        user_id: joinRequest.user_id,
        action,
        reviewed_by: systemUserId,
        admin_id: admin.id
      }
    )

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`
    })
  } catch (error) {
    console.error('Process join request error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}