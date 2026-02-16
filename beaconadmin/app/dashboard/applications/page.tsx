'use client'

import { useState, useEffect } from 'react'
import {
  Check,
  X,
  Clock,
  User,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface Application {
  id: string
  communityId: string
  userId: string
  answers: any[]
  agreedToGuidelines: boolean
  submittedAt: string
  rejectionReason: string | null
  reviewedAt: string | null
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  community: {
    id: string
    name: string
    avatarUrl: string | null
  }
  applicant: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/applications?status=${filter}`)
      if (!response.ok) throw new Error('Failed to fetch applications')

      const data = await response.json()
      setApplications(data.applications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const handleAccept = async (applicationId: string) => {
    if (processingIds.has(applicationId)) return

    setProcessingIds(new Set([...processingIds, applicationId]))
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept application')
      }

      toast.success('Application accepted successfully')

      // Remove from current list if viewing pending
      if (filter === 'pending') {
        setApplications(prev => prev.filter(app => app.id !== applicationId))
      } else {
        fetchApplications()
      }
    } catch (error: any) {
      console.error('Error accepting application:', error)
      toast.error(error.message || 'Failed to accept application')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  const handleReject = async (applicationId: string) => {
    const reason = rejectionReasons[applicationId]
    if (!reason || !reason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    if (processingIds.has(applicationId)) return

    setProcessingIds(new Set([...processingIds, applicationId]))
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: reason.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject application')
      }

      toast.success('Application rejected')
      setShowRejectionModal(null)
      setRejectionReasons(prev => {
        const newReasons = { ...prev }
        delete newReasons[applicationId]
        return newReasons
      })

      // Remove from current list if viewing pending
      if (filter === 'pending') {
        setApplications(prev => prev.filter(app => app.id !== applicationId))
      } else {
        fetchApplications()
      }
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      toast.error(error.message || 'Failed to reject application')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'accepted':
        return <Check className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Applications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and manage join requests for your communities
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b mb-6">
        <nav className="-mb-px flex space-x-8 px-6">
          {['pending', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm capitalize
                ${filter === status
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                {getStatusIcon(status)}
                <span>{status}</span>
                {status === 'pending' && applications.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs font-medium">
                    {applications.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            {filter === 'pending' ? (
              <Clock className="h-12 w-12 mx-auto" />
            ) : filter === 'accepted' ? (
              <Check className="h-12 w-12 mx-auto" />
            ) : (
              <X className="h-12 w-12 mx-auto" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {filter} applications
          </h3>
          <p className="text-gray-500">
            {filter === 'pending'
              ? 'There are no pending applications to review at the moment.'
              : `There are no ${filter} applications to display.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow">
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Applicant Avatar */}
                    <div className="flex-shrink-0">
                      {application.applicant.avatarUrl ? (
                        <img
                          src={application.applicant.avatarUrl}
                          alt={application.applicant.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Application Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.applicant.fullName}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{application.applicant.email}</p>

                      {/* Community Info */}
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="font-medium">Applying to:</span>
                        <span className="ml-1">{application.community.name}</span>
                      </div>

                      {/* Submission Date */}
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Submitted: {formatDate(application.submittedAt)}</span>
                      </div>

                      {/* Guidelines Agreement */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center text-sm ${
                          application.agreedToGuidelines ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {application.agreedToGuidelines ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Agreed to guidelines
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Did not agree to guidelines
                            </>
                          )}
                        </span>
                      </div>

                      {/* Rejection Reason (if rejected) */}
                      {application.status === 'rejected' && application.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 rounded-md">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">Rejection reason:</span> {application.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  {application.answers && application.answers.length > 0 && (
                    <button
                      onClick={() => toggleCardExpansion(application.id)}
                      className="ml-4 text-gray-400 hover:text-gray-600"
                    >
                      {expandedCards.has(application.id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Action Buttons (for pending applications) */}
                {application.status === 'pending' && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleAccept(application.id)}
                      disabled={processingIds.has(application.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processingIds.has(application.id) ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => setShowRejectionModal(application.id)}
                      disabled={processingIds.has(application.id)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Content - Application Answers */}
              {expandedCards.has(application.id) && application.answers && application.answers.length > 0 && (
                <div className="border-t px-6 py-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Application Responses
                  </h4>
                  <div className="space-y-3">
                    {application.answers.map((answer: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-md">
                        <p className="text-sm text-gray-600 mb-1">Question {index + 1}:</p>
                        <p className="text-sm text-gray-900">
                          {answer.answer || <span className="italic text-gray-400">No response provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Provide Rejection Reason
            </h3>
            <textarea
              value={rejectionReasons[showRejectionModal] || ''}
              onChange={(e) => setRejectionReasons(prev => ({
                ...prev,
                [showRejectionModal]: e.target.value
              }))}
              placeholder="Please provide a reason for rejecting this application..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
              rows={4}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectionModal(null)
                  setRejectionReasons(prev => {
                    const newReasons = { ...prev }
                    delete newReasons[showRejectionModal]
                    return newReasons
                  })
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectionModal)}
                disabled={!rejectionReasons[showRejectionModal]?.trim() || processingIds.has(showRejectionModal)}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {processingIds.has(showRejectionModal) ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}