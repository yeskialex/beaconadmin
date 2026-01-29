import bcrypt from 'bcryptjs'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string | null
  is_active: boolean | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createAdminSession(adminUserId: string): Promise<string> {
  const supabase = await createServerSupabaseClient()
  const token = generateSessionToken()
  const tokenHash = await hashPassword(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_user_id: adminUserId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    throw new Error('Failed to create session')
  }

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })

  return token
}

export async function validateAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin-session')?.value

  if (!sessionToken) {
    return null
  }

  const supabase = await createServerSupabaseClient()
  
  // Get all active sessions and check token against each
  const { data: sessions } = await supabase
    .from('admin_sessions')
    .select('*, admin_users!inner(*)')
    .gt('expires_at', new Date().toISOString())
    .eq('admin_users.is_active', true)

  if (!sessions || sessions.length === 0) {
    return null
  }

  // Find matching session by checking token hash
  for (const session of sessions) {
    const isValid = await verifyPassword(sessionToken, session.token_hash)
    if (isValid) {
      return session.admin_users as AdminUser
    }
  }

  return null
}

export async function logAdminActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any
) {
  const supabase = await createServerSupabaseClient()
  const admin = await validateAdminSession()
  
  if (!admin) return

  await supabase.from('admin_activity_logs').insert({
    admin_user_id: admin.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details
  })
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin-session')?.value

  if (sessionToken) {
    const supabase = await createServerSupabaseClient()
    
    // Delete session from database
    const { data: sessions } = await supabase
      .from('admin_sessions')
      .select('id, token_hash')
      .gt('expires_at', new Date().toISOString())

    if (sessions) {
      for (const session of sessions) {
        const isValid = await verifyPassword(sessionToken, session.token_hash)
        if (isValid) {
          await supabase
            .from('admin_sessions')
            .delete()
            .eq('id', session.id)
          break
        }
      }
    }
  }

  // Clear cookie
  cookieStore.delete('admin-session')
}