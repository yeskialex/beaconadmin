'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Users, MapPin, User, Eye, Lock, Globe, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface EventDetail {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  is_private: boolean
  is_community_event: boolean
  remind_me: boolean
  reminder_time?: string
  created_at: string
  updated_at: string
  created_by: string
  author: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  community?: {
    id: string
    name: string
    avatar_url?: string
  }
  attendees?: Attendee[]
}

interface Attendee {
  id: string
  user_id: string
  status: 'attending' | 'maybe' | 'not_attending'
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchEventDetail()
  }, [resolvedParams.eventId])

  const fetchEventDetail = async () => {
    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      } else {
        toast.error('Failed to fetch event details')
        router.push('/dashboard/events')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Error loading event')
      router.push('/dashboard/events')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return

    if (!confirm(`Are you sure you want to delete the event "${event.title}"?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Event deleted successfully')
        router.push('/dashboard/events')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Error deleting event')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const durationMs = endDate.getTime() - startDate.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const isEventPast = (endTime: string) => {
    return new Date(endTime) < new Date()
  }

  const isEventUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date()
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

  if (!event) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Event not found</p>
        </div>
      </div>
    )
  }

  const attendingCount = event.attendees?.filter(a => a.status === 'attending').length || 0
  const maybeCount = event.attendees?.filter(a => a.status === 'maybe').length || 0

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-black">Event Details</h1>
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Event Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-bold text-black">{event.title}</h2>
                  {event.is_private ? (
                    <Lock className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Globe className="h-5 w-5 text-green-500" />
                  )}
                </div>

                {/* Event Status */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isEventPast(event.end_time)
                      ? 'bg-gray-100 text-gray-800'
                      : isEventUpcoming(event.start_time)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isEventPast(event.end_time)
                      ? 'Past Event'
                      : isEventUpcoming(event.start_time)
                      ? 'Upcoming'
                      : 'Happening Now'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.is_community_event
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {event.is_community_event ? 'Community Event' : 'Personal Event'}
                  </span>
                </div>

                {/* Creator Info */}
                <div className="flex items-center space-x-3">
                  {event.author.avatar_url ? (
                    <img
                      src={event.author.avatar_url}
                      alt={event.author.full_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-black">
                      Created by{' '}
                      <Link
                        href={`/dashboard/users/${event.author.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {event.author.full_name}
                      </Link>
                    </p>
                    <p className="text-xs text-black">
                      {event.created_at !== event.updated_at ? (
                        <>Updated {new Date(event.updated_at).toLocaleString()}</>
                      ) : (
                        <>Created {new Date(event.created_at).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                 
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Time & Community */}
              <div className="space-y-6">
                {/* Date & Time */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-black">
                    <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                    Date & Time
                  </h3>
                  <div className="space-y-2 text-sm text-black">
                    <div className="flex items-center">
                      <span className="font-medium w-16">Start:</span>
                      <span>{new Date(event.start_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-16">End:</span>
                      <span>{new Date(event.end_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-16">Duration:</span>
                      <span>{formatDuration(event.start_time, event.end_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Community */}
                {event.community && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-black">
                      <Users className="h-5 w-5 mr-2 text-green-500" />
                      Community
                    </h3>
                    <div className="flex items-center space-x-3">
                      {event.community.avatar_url ? (
                        <img
                          src={event.community.avatar_url}
                          alt={event.community.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                      <Link
                        href={`/dashboard/communities/${event.community.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {event.community.name}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Reminder */}
                {event.remind_me && event.reminder_time && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-black">
                      <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                      Reminder
                    </h3>
                    <p className="text-sm text-black">
                      Reminder set for {new Date(event.reminder_time).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Attendees */}
              {event.attendees && event.attendees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-black">
                    <Users className="h-5 w-5 mr-2 text-purple-500" />
                    Attendees ({event.attendees.length})
                  </h3>

                  {/* Attendance Stats */}
                  <div className="flex items-center space-x-4 mb-4 text-sm">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {attendingCount} attending
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {maybeCount} maybe
                    </span>
                  </div>

                  {/* Attendee List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {event.attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {attendee.user.avatar_url ? (
                            <img
                              src={attendee.user.avatar_url}
                              alt={attendee.user.full_name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                          )}
                          <Link
                            href={`/dashboard/users/${attendee.user_id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {attendee.user.full_name}
                          </Link>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          attendee.status === 'attending'
                            ? 'bg-green-100 text-green-800'
                            : attendee.status === 'maybe'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attendee.status === 'attending' ? 'Going' : attendee.status === 'maybe' ? 'Maybe' : 'Not Going'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Event Description */}
          {event.description && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-black">Description</h3>
              <div className="prose max-w-none">
                <p className="text-black whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          {/* Event Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-black">
              <div className="flex items-center space-x-4">
                <span>Event ID: {event.id}</span>
                {event.is_private && (
                  <span className="flex items-center">
                    <Lock className="h-4 w-4 mr-1" />
                    Private Event
                  </span>
                )}
              </div>
              <span>
                {isEventPast(event.end_time)
                  ? 'Event ended'
                  : isEventUpcoming(event.start_time)
                  ? `Starts ${new Date(event.start_time).toLocaleDateString()}`
                  : 'Event in progress'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}