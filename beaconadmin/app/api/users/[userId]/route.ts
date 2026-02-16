import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params
    const supabase = await createServerSupabaseAdminClient()

    // First try to get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Also try to get auth user data for email
    let authUserData = null
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(userId)
      if (authData?.user) {
        authUserData = {
          email: authData.user.email,
          user_metadata: authData.user.user_metadata
        }
      }
    } catch (err) {
      console.log('Could not fetch auth user data')
    }

    if (profileError && !authUserData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Combine profile and auth data
    const user = {
      id: userId,
      email: authUserData?.email || profile?.email || 'Unknown',
      full_name: profile?.full_name || authUserData?.user_metadata?.full_name || 'Unknown User',
      avatar_url: profile?.avatar_url || authUserData?.user_metadata?.avatar_url || null,
      created_at: profile?.created_at || authUserData?.user_metadata?.created_at || new Date().toISOString()
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Fetch user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}