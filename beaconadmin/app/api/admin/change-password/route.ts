import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, hashPassword, updatePasswordChanged, needsPasswordChange } from '@/lib/auth/auth-utils'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

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
    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Get current password hash
    const { data: adminData, error: fetchError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', admin.id)
      .single()

    if (fetchError || !adminData) {
      return NextResponse.json(
        { error: 'Failed to verify current password' },
        { status: 500 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminData.password_hash)
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
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Log the password change activity
    await supabase.from('admin_activity_logs').insert({
      admin_user_id: admin.id,
      action: 'password_changed',
      entity_type: 'admin_users',
      entity_id: admin.id,
      details: {
        forced_change: needsPasswordChange(admin),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}