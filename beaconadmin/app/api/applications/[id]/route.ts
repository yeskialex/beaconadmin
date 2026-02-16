import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity, canAccessCommunity } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const reviewApplicationSchema = z.object({
  action: z.enum(['accept', 'reject']),
  rejectionReason: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = reviewApplicationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { action, rejectionReason } = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Get the application to check community access
    const { data: application, error: fetchError } = await supabase
      .from('community_join_applications')
      .select('*, communities!inner(id, name)')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if admin has access to this community
    if (!canAccessCommunity(admin, application.community_id)) {
      return NextResponse.json(
        { error: 'You do not have permission to review this application' },
        { status: 403 }
      )
    }

    // Check if already reviewed
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application has already been reviewed' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    if (action === 'accept') {
      // Update application status
      const { error: updateError } = await supabase
        .from('community_join_applications')
        .update({
          status: 'accepted',
          reviewed_at: now
        })
        .eq('id', resolvedParams.id)

      if (updateError) {
        console.error('Error updating application:', updateError)
        return NextResponse.json(
          { error: 'Failed to update application' },
          { status: 500 }
        )
      }

      // Add user to community members
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: application.community_id,
          user_id: application.user_id,
          role: 'user',
          joined_at: now
        })

      if (memberError) {
        // If member already exists, that's okay
        if (!memberError.message?.includes('duplicate')) {
          console.error('Error adding member:', memberError)
        }
      }

      // Update community member count
      const { data: communityData } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', application.community_id)
        .single()

      if (communityData) {
        await supabase
          .from('communities')
          .update({ member_count: (communityData.member_count || 0) + 1 })
          .eq('id', application.community_id)
      }

      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'application_accepted',
          title: 'Application Accepted!',
          body: `Your application to join ${application.communities.name} has been accepted.`,
          data: {
            community_id: application.community_id,
            community_name: application.communities.name
          },
          target_type: 'community',
          target_id: application.community_id
        })

      await logAdminActivity(
        'application_accepted',
        'community_join_applications',
        resolvedParams.id,
        {
          community_id: application.community_id,
          community_name: application.communities.name,
          user_id: application.user_id
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Application accepted successfully'
      })

    } else { // action === 'reject'
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('community_join_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: now
        })
        .eq('id', resolvedParams.id)

      if (updateError) {
        console.error('Error updating application:', updateError)
        return NextResponse.json(
          { error: 'Failed to update application' },
          { status: 500 }
        )
      }

      // Create notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'application_rejected',
          title: 'Application Update',
          body: `Your application to join ${application.communities.name} was not approved. Reason: ${rejectionReason}`,
          data: {
            community_id: application.community_id,
            community_name: application.communities.name,
            rejection_reason: rejectionReason
          },
          target_type: 'community',
          target_id: application.community_id
        })

      await logAdminActivity(
        'application_rejected',
        'community_join_applications',
        resolvedParams.id,
        {
          community_id: application.community_id,
          community_name: application.communities.name,
          user_id: application.user_id,
          rejection_reason: rejectionReason
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Application rejected'
      })
    }
  } catch (error) {
    console.error('Application review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}