'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Clock, User, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface JoinRequest {
  id: string
  user_id: string
  status: 'pending' | 'accepted' | 'declined'
  requested_at: string
  message?: string
  user?: {
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

interface Community {
  id: string
  name: string
  is_private: boolean
}

export default function CommunityRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [community, setCommunity] = useState<Community | null>(null)
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCommunityAndRequests()
  }, [resolvedParams.id])

  const fetchCommunityAndRequests = async () => {
    try {
      // Fetch community details
      const communityResponse = await fetch(`/api/communities/${resolvedParams.id}`)
      if (communityResponse.ok) {
        const communityData = await communityResponse.json()
        setCommunity(communityData.community)
      } else {
        toast.error('Failed to fetch community details')
        router.push('/dashboard/communities')
        return
      }

      // Fetch join requests
      const requestsResponse = await fetch(`/api/communities/${resolvedParams.id}/requests`)
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRequests(requestsData.requests)
      } else {
        toast.error('Failed to fetch join requests')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error loading data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId)
    try {
      const response = await fetch(`/api/communities/${resolvedParams.id}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const responseData = await response.json()

      if (response.ok) {
        toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        // Refresh the requests list
        await fetchCommunityAndRequests()
      } else {
        console.error('API Error Response:', responseData)
        console.error('Full response:', response)
        toast.error(responseData.error || `Failed to ${action} request`)
        if (responseData.details) {
          console.error('Error details:', responseData.details)
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast.error(`Error ${action}ing request`)
    } finally {
      setProcessingId(null)
    }
  }

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

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-black">Join Requests</h1>
            <p className="text-gray-600 mt-1">{community.name}</p>
          </div>
        </div>

        {!community.is_private ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              This is a public community. Join requests are automatically approved.
            </p>
          </div>
        ) : null}

        {/* Pending Requests */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {request.user?.user_metadata?.avatar_url ? (
                          <img
                            src={request.user.user_metadata.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {request.user?.user_metadata?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.user?.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Requested {new Date(request.requested_at).toLocaleString()}
                        </p>
                        {request.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleRequest(request.id, 'approve')}
                        disabled={processingId === request.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests History */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Request History ({processedRequests.length})
            </h2>
          </div>

          {processedRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No processed requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {processedRequests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {request.user?.user_metadata?.avatar_url ? (
                          <img
                            src={request.user.user_metadata.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.user?.user_metadata?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}