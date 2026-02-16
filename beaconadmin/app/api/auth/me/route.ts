import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export async function GET() {
  try {
    const admin = await validateAdminSession()

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return admin data without sensitive information
    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        is_active: admin.is_active,
        assigned_communities: admin.assigned_communities
      }
    })
  } catch (error) {
    console.error('Error fetching admin session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}