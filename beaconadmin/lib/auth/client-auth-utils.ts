// Client-side authentication utilities
// This file contains functions that can be safely used in client components

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'super_admin' | 'community_admin'
  is_active: boolean | null
  must_change_password: boolean
  password_changed_at: string | null
  assigned_communities?: string[]
}

export function isSuperAdmin(admin: AdminUser): boolean {
  return admin.role === 'super_admin'
}

export function isCommunityAdmin(admin: AdminUser): boolean {
  return admin.role === 'community_admin'
}

export function canAccessCommunity(admin: AdminUser, communityId: string): boolean {
  // Super admins can access all communities
  if (isSuperAdmin(admin)) {
    return true
  }

  // Community admins can only access their assigned communities
  return admin.assigned_communities?.includes(communityId) ?? false
}

export function canCreateCommunityAdmin(admin: AdminUser): boolean {
  return isSuperAdmin(admin)
}

export function canUploadNewsletter(admin: AdminUser): boolean {
  return isSuperAdmin(admin)
}

export function canAccessGlobalReports(admin: AdminUser): boolean {
  return isSuperAdmin(admin)
}

export function canDeleteCommunity(admin: AdminUser): boolean {
  return isSuperAdmin(admin)
}

export function canAssignCommunities(admin: AdminUser): boolean {
  return isSuperAdmin(admin)
}

export function needsPasswordChange(admin: AdminUser): boolean {
  return admin.must_change_password
}