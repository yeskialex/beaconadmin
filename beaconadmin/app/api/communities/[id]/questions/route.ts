import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Fetch questions for the community
    const { data: questions, error } = await supabase
      .from('community_questions')
      .select('*')
      .eq('community_id', resolvedParams.id)
      .order('question_order')

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions: questions || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}