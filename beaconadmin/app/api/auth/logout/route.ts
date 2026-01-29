import { NextResponse } from 'next/server'
import { logout, logAdminActivity, validateAdminSession } from '@/lib/auth/auth-utils'

export async function POST() {
  try {
    const admin = await validateAdminSession()

    if (admin) {
      await logAdminActivity('admin_logout', 'admin_users', admin.id)
    }

    await logout()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}