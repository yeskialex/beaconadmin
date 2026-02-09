'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import ApplicationReview from '@/components/communities/ApplicationReview'

interface Community {
  id: string
  name: string
  description?: string
  avatar_url?: string
}

export default function CommunityApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const communityId = params.id as string
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommunity()
  }, [communityId])

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`)
      const data = await response.json()

      if (data.community) {
        setCommunity(data.community)
      }
    } catch (error) {
      console.error('Error fetching community:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Community not found</h2>
        <button
          onClick={() => router.push('/dashboard/communities')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Communities
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {community.avatar_url ? (
              <img
                src={community.avatar_url}
                alt={community.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {community.name} - Applications
              </h1>
              {community.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {community.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => router.push(`/dashboard/communities/${communityId}/edit`)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit Community
            </button>
            <button
              onClick={() => router.push(`/dashboard/communities/${communityId}`)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Application Review Component */}
      <div className="px-4 sm:px-6">
        <ApplicationReview communityId={communityId} communityName={community.name} />
      </div>
    </div>
  )
}