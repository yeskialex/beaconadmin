import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

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

    const supabase = await createServerSupabaseClient()

    // Fetch universities
    const { data: universities, error } = await supabase
      .from('universities')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching universities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch universities' },
        { status: 500 }
      )
    }

    return NextResponse.json({ universities })
  } catch (error) {
    console.error('Fetch universities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}