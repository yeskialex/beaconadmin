import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { verifyPassword, createAdminSession, logAdminActivity } from '@/lib/auth/auth-utils'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Login attempt for email:', body.email)

    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error)
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data
    const supabase = await createServerSupabaseClient()

    // Get admin user by email
    console.log('Querying admin user for email:', email)
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('Query result:', { adminUser, userError })

    if (userError || !adminUser) {
      console.log('User not found or error:', userError)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!adminUser.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      )
    }

    // Verify password
    console.log('Verifying password for user:', adminUser.email)
    const isValidPassword = await verifyPassword(password, adminUser.password_hash)
    console.log('Password verification result:', isValidPassword)

    if (!isValidPassword) {
      console.log('Password verification failed')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session
    await createAdminSession(adminUser.id)

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    // Log the activity
    await logAdminActivity('admin_login', 'admin_users', adminUser.id, {
      email: adminUser.email,
      role: adminUser.role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}