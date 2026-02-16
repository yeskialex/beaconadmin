import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, hashPassword, verifyPassword, logAdminActivity } from '@/lib/auth/auth-utils'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
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
    const validationResult = changePasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validationResult.data
    const supabase = await createServerSupabaseAdminClient()

    // Get current admin user data
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', admin.id)
      .single()

    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, adminUser.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in database
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
        must_change_password: false // Clear the flag if it was set
      })
      .eq('id', admin.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Log the activity
    await logAdminActivity(
      'password_changed',
      'admin_users',
      admin.id,
      { changed_by: 'self' }
    )

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}