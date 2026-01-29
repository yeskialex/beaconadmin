'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import CommunityForm from '@/components/communities/CommunityForm'
import { toast } from 'sonner'

export default function EditCommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [community, setCommunity] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await fetch(`/api/communities/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setCommunity(data.community)
        } else {
          toast.error('Failed to fetch community details')
          router.push('/dashboard/communities')
        }
      } catch (error) {
        console.error('Error fetching community:', error)
        toast.error('Error loading community')
        router.push('/dashboard/communities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunity()
  }, [resolvedParams.id, router])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Community not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-black">Edit Community</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <CommunityForm initialData={community} isEditing={true} />
        </div>
      </div>
    </div>
  )
}