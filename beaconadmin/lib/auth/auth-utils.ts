import bcrypt from 'bcryptjs'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Re-export AdminUser interface and client-side functions from client-auth-utils
export type {
  AdminUser
} from './client-auth-utils'

export {
  isSuperAdmin,
  isCommunityAdmin,
  canAccessCommunity,
  canCreateCommunityAdmin,
  canUploadNewsletter,
  canAccessGlobalReports,
  canDeleteCommunity,
  canAssignCommunities,
  needsPasswordChange
} from './client-auth-utils'

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
  const supabase = await createServerSupabaseAdminClient()
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

  const supabase = await createServerSupabaseAdminClient()

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
      const adminUser = session.admin_users as AdminUser

      // For community admins, fetch their assigned communities
      if (adminUser.role === 'community_admin') {
        const { data: assignments } = await supabase
          .from('admin_community_assignments')
          .select('community_id')
          .eq('admin_id', adminUser.id)

        adminUser.assigned_communities = assignments?.map(a => a.community_id) || []
      }

      return adminUser
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
  const supabase = await createServerSupabaseAdminClient()
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
    const supabase = await createServerSupabaseAdminClient()

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

// Server-only functions below this line

export async function updatePasswordChanged(adminId: string): Promise<void> {
  const supabase = await createServerSupabaseAdminClient()

  await supabase
    .from('admin_users')
    .update({
      must_change_password: false,
      password_changed_at: new Date().toISOString()
    })
    .eq('id', adminId)
}

export async function getAdminAssignedCommunities(adminId: string): Promise<string[]> {
  const supabase = await createServerSupabaseAdminClient()

  // Use the database function we created
  const { data } = await supabase.rpc('get_admin_assigned_communities', {
    admin_uuid: adminId
  })

  return data?.map((row: any) => row.community_id) || []
}

export async function createCommunityAdmin(
  email: string,
  tempPassword: string,
  fullName: string | null = null,
  createdBy: string
): Promise<{ id: string; tempPassword: string } | null> {
  const supabase = await createServerSupabaseAdminClient()

  const passwordHash = await hashPassword(tempPassword)

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'community_admin',
      must_change_password: true,
      created_by: createdBy
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating community admin:', error)
    return null
  }

  return {
    id: data.id,
    tempPassword
  }
}

export async function assignCommunityToAdmin(
  adminId: string,
  communityId: string,
  assignedBy: string
): Promise<boolean> {
  const supabase = await createServerSupabaseAdminClient()

  const { error } = await supabase
    .from('admin_community_assignments')
    .insert({
      admin_id: adminId,
      community_id: communityId,
      assigned_by: assignedBy
    })

  return !error
}