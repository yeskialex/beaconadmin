'use client'

import { useState, useEffect } from 'react'
import CommunityFormWithApplication from './CommunityFormWithApplication'

interface CommunityFormWithApplicationWrapperProps {
  initialData?: any
  isEditing?: boolean
}

export default function CommunityFormWithApplicationWrapper({
  initialData,
  isEditing = false
}: CommunityFormWithApplicationWrapperProps) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsSuperAdmin(data.admin.role === 'super_admin')
        }
      } catch (error) {
        console.error('Error fetching admin info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminInfo()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <CommunityFormWithApplication
      initialData={initialData}
      isEditing={isEditing}
      isSuperAdmin={isSuperAdmin}
    />
  )
}