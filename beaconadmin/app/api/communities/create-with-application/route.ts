import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession, logAdminActivity, isCommunityAdmin } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const createCommunityWithApplicationSchema = z.object({
  // Basic community info
  name: z.string().min(2),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
  is_private: z.boolean(),
  is_active: z.boolean(),
  is_default: z.boolean(),
  scope: z.enum(['global', 'institutional']),
  university_id: z.string().optional().nullable(),
  // Join page info
  join_description: z.string().min(10),
  join_cover_url: z.string().optional(),
  join_button_text: z.string().optional(),
  // Guidelines
  guidelines_text: z.string().min(20),
  requires_agreement: z.boolean(),
  agreement_prompt: z.string().optional(),
  // Questions
  questions: z.array(z.object({
    question_text: z.string().min(1),
    question_order: z.number(),
    is_required: z.boolean(),
    placeholder_text: z.string().optional(),
    max_length: z.number()
  })).min(1, 'At least one question is required')
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
    const validationResult = createCommunityWithApplicationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Start a transaction-like operation
    // First, create the community
    // Use a system user ID but track the admin who created it
    const systemUserId = process.env.SYSTEM_USER_ID
    if (!systemUserId) {
      return NextResponse.json(
        { error: 'System configuration error: SYSTEM_USER_ID not configured' },
        { status: 500 }
      )
    }

    const { data: community, error: createError } = await supabase
      .from('communities')
      .insert({
        name: data.name,
        description: data.description,
        avatar_url: data.avatar_url || null,
        cover_url: data.cover_url || null,
        is_private: data.is_private,
        is_active: data.is_active,
        is_default: data.is_default,
        scope: data.scope,
        university_id: data.scope === 'global' ? null : data.university_id,
        creator_id: systemUserId,
        created_by_admin_id: admin.id, // Track which admin created it
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating community:', createError)
      return NextResponse.json(
        { error: 'Failed to create community', details: createError.message },
        { status: 500 }
      )
    }

    // Now create the join info
    const { error: joinInfoError } = await supabase
      .from('community_join_info')
      .insert({
        community_id: community.id,
        description: data.join_description,
        cover_url: data.join_cover_url || null,
        button_text: data.join_button_text || 'Apply to Join'
      })

    if (joinInfoError) {
      console.error('Error creating join info:', joinInfoError)
      // Rollback: Delete the community
      await supabase.from('communities').delete().eq('id', community.id)
      return NextResponse.json(
        { error: 'Failed to create join info', details: joinInfoError.message },
        { status: 500 }
      )
    }

    // Create the guidelines
    const { error: guidelinesError } = await supabase
      .from('community_guidelines')
      .insert({
        community_id: community.id,
        guidelines_text: data.guidelines_text,
        requires_agreement: data.requires_agreement,
        agreement_prompt: data.agreement_prompt || 'Do you agree to follow the group guidelines and respect members?'
      })

    if (guidelinesError) {
      console.error('Error creating guidelines:', guidelinesError)
      // Rollback: Delete the community and join info
      await supabase.from('community_join_info').delete().eq('community_id', community.id)
      await supabase.from('communities').delete().eq('id', community.id)
      return NextResponse.json(
        { error: 'Failed to create guidelines', details: guidelinesError.message },
        { status: 500 }
      )
    }

    // Create the questions
    const questionsData = data.questions.map((q, index) => ({
      community_id: community.id,
      question_text: q.question_text.trim(),
      question_order: index + 1,
      is_required: q.is_required,
      placeholder_text: q.placeholder_text?.trim() || null,
      max_length: q.max_length || 500
    }))

    const { error: questionsError } = await supabase
      .from('community_questions')
      .insert(questionsData)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      // Rollback: Delete everything
      await supabase.from('community_guidelines').delete().eq('community_id', community.id)
      await supabase.from('community_join_info').delete().eq('community_id', community.id)
      await supabase.from('communities').delete().eq('id', community.id)
      return NextResponse.json(
        { error: 'Failed to create questions', details: questionsError.message },
        { status: 500 }
      )
    }

    // Auto-assign community admin to their created community
    if (isCommunityAdmin(admin)) {
      const { error: assignError } = await supabase
        .from('admin_community_assignments')
        .insert({
          admin_id: admin.id,
          community_id: community.id,
          assigned_by: admin.id // Self-assignment for created communities
        })

      if (assignError) {
        console.error('Error auto-assigning community admin to created community:', assignError)
        // Don't fail the creation, just log the error
        // The community admin can be manually assigned later if needed
      }
    }

    // Log the activity
    await logAdminActivity(
      'community_created_with_application',
      'communities',
      community.id,
      {
        name: community.name,
        questions_count: data.questions.length,
        has_guidelines: true,
        requires_agreement: data.requires_agreement
      }
    )

    return NextResponse.json({
      community,
      message: 'Community created successfully with application settings!'
    })
  } catch (error) {
    console.error('Create community with application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}