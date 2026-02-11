'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, User, MessageSquare, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { toast } from 'sonner'

interface ApplicationAnswer {
  answer: string
  answered_at: string
  question_id?: string
}

interface Application {
  id: string
  community_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'declined'
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string
  message?: string
  rejection_reason?: string
  // From join_applications
  answers?: ApplicationAnswer[]
  agreed_to_guidelines?: boolean
  // User profile
  profiles?: {
    full_name: string
    email: string
    avatar_url?: string
    user_name?: string
  }
}

interface Question {
  id: string
  question_text: string
  question_order: number
  is_required: boolean
}

interface ApplicationReviewProps {
  communityId: string
  communityName: string
}

export default function ApplicationReview({ communityId, communityName }: ApplicationReviewProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set())
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('pending')

  useEffect(() => {
    fetchApplications()
    fetchQuestions()
  }, [communityId, filter])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/questions`)
      const data = await response.json()
      if (data.questions) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/communities/${communityId}/applications?filter=${filter}`)
      const data = await response.json()

      if (data.applications) {
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (applicationId: string) => {
    const newExpanded = new Set(expandedApplications)
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId)
    } else {
      newExpanded.add(applicationId)
    }
    setExpandedApplications(newExpanded)
  }

  const handleApprove = async (applicationId: string, userId: string) => {
    if (!confirm('Are you sure you want to approve this application?')) return

    try {
      setProcessingId(applicationId)

      const response = await fetch(`/api/communities/${communityId}/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        toast.success('Application approved successfully')
        await fetchApplications()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve application')
      }
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error('Failed to approve application')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    const reason = rejectionReasons[applicationId] || ''

    if (!reason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    if (!confirm('Are you sure you want to reject this application?')) return

    try {
      setProcessingId(applicationId)

      const response = await fetch(`/api/communities/${communityId}/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: reason })
      })

      if (response.ok) {
        toast.success('Application rejected')
        setRejectionReasons(prev => ({ ...prev, [applicationId]: '' }))
        await fetchApplications()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject application')
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        )
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Accepted
          </span>
        )
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Declined
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Application Review - {communityName}
        </h3>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-black focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">No applications found</h4>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'pending'
              ? 'There are no pending applications to review.'
              : `No ${filter} applications found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleExpanded(application.id)}
                      className="mt-1 text-gray-400 hover:text-gray-600"
                    >
                      {expandedApplications.has(application.id)
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </button>

                    {application.profiles?.avatar_url ? (
                      <img
                        src={application.profiles.avatar_url}
                        alt={application.profiles.full_name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {application.profiles?.full_name || 'Unknown User'}
                        </h4>
                        {application.profiles?.user_name && (
                          <span className="text-sm text-gray-500">
                            @{application.profiles.user_name}
                          </span>
                        )}
                        {getStatusBadge(application.status)}
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        {application.profiles?.email}
                      </p>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Applied {new Date(application.requested_at).toLocaleDateString()}
                        </span>

                        {application.agreed_to_guidelines && (
                          <span className="flex items-center text-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Agreed to guidelines
                          </span>
                        )}

                        {/* Response completion indicator */}
                        {questions.length > 0 && (
                          <span className="flex items-center text-gray-500">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {(() => {
                              const answeredCount = questions.filter(question => {
                                const answer = application.answers?.find(ans =>
                                  ans.question_id === question.id
                                ) || (
                                  application.answers && application.answers.length > 0
                                    ? application.answers[questions.indexOf(question)]
                                    : null
                                )
                                return answer?.answer?.trim()
                              }).length
                              return `${answeredCount}/${questions.length} responses`
                            })()}
                          </span>
                        )}
                      </div>

                      {application.message && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <span className="font-medium">Application Message:</span>
                          <p className="mt-1">{application.message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {application.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(application.id, application.user_id)}
                        disabled={processingId === application.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </button>

                      <button
                        onClick={() => toggleExpanded(application.id)}
                        disabled={processingId === application.id}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {expandedApplications.has(application.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* Questions and Answers */}
                    {questions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">
                          Application Questions & Responses
                          <span className="ml-2 text-xs text-gray-500">({questions.length} questions)</span>
                        </h5>
                        <div className="space-y-3">
                          {questions.map((question) => {
                            // Find the answer that matches this question ID
                            const answer = application.answers?.find(ans =>
                              ans.question_id === question.id
                            ) || (
                              // Fallback: try to match by index for backwards compatibility
                              application.answers && application.answers.length > 0
                                ? application.answers[questions.indexOf(question)]
                                : null
                            )

                            return (
                              <div key={question.id} className={`rounded p-3 border ${answer?.answer ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                <p className="text-sm font-medium text-gray-700">
                                  <span className="text-xs text-gray-500 mr-2">Q{question.question_order}:</span>
                                  {question.question_text}
                                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                </p>
                                <div className="mt-2">
                                  {answer?.answer ? (
                                    <div className="text-sm text-gray-800 bg-white rounded p-2 border">
                                      {answer.answer}
                                    </div>
                                  ) : (
                                    <div className="text-sm italic text-gray-400 bg-gray-100 rounded p-2">
                                      No response provided
                                      {question.is_required && (
                                        <span className="text-red-500 ml-1 font-medium">(Required)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {answer?.answered_at && (
                                  <p className="mt-2 text-xs text-gray-400">
                                    Answered: {new Date(answer.answered_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason (for pending) */}
                    {application.status === 'pending' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          value={rejectionReasons[application.id] || ''}
                          onChange={(e) => setRejectionReasons(prev => ({
                            ...prev,
                            [application.id]: e.target.value
                          }))}
                          rows={2}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-600"
                          placeholder="Provide a reason for rejection..."
                        />

                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleReject(application.id)}
                            disabled={processingId === application.id || !rejectionReasons[application.id]?.trim()}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject with Reason
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show rejection reason (for declined) */}
                    {application.status === 'declined' && application.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                        <p className="mt-1 text-sm text-red-700">{application.rejection_reason}</p>
                      </div>
                    )}

                    {/* Review info */}
                    {application.reviewed_at && (
                      <div className="text-xs text-gray-500">
                        Reviewed on {new Date(application.reviewed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}