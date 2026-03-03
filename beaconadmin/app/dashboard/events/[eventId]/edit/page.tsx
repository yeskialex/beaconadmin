'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface EventData {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  is_community_event: boolean
  is_private: boolean
  community_id: string
  category_id: string
  remind_me: boolean
  reminder_time: string
  community?: {
    id: string
    name: string
  }
}

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    is_community_event: false,
    is_private: false,
    community_id: '',
    category_id: '',
    remind_me: false,
    reminder_time: ''
  })

  // Fetch event data and communities when component mounts
  useEffect(() => {
    fetchEventData()
    fetchCommunities()
  }, [resolvedParams.eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}`)
      if (response.ok) {
        const data = await response.json()
        const event = data.event

        // Format datetime for input fields
        const formatDateTime = (dateString: string) => {
          if (!dateString) return ''
          const date = new Date(dateString)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        setFormData({
          title: event.title || '',
          description: event.description || '',
          start_time: formatDateTime(event.start_time),
          end_time: formatDateTime(event.end_time),
          location: event.location || '',
          is_community_event: event.is_community_event || false,
          is_private: event.is_private || false,
          community_id: event.community_id || '',
          category_id: event.category_id || '',
          remind_me: event.remind_me || false,
          reminder_time: formatDateTime(event.reminder_time)
        })
      } else {
        toast.error('Failed to fetch event details')
        router.push('/dashboard/events')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Error loading event')
      router.push('/dashboard/events')
    } finally {
      setIsLoadingEvent(false)
    }
  }

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities')
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities || [])
      } else {
        console.error('Failed to fetch communities')
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate community selection for community events
    if (formData.is_community_event && !formData.community_id) {
      toast.error('Please select a community for this community event')
      setIsLoading(false)
      return
    }

    // Prepare data for submission - convert empty strings to null for UUID fields
    const submitData = {
      ...formData,
      community_id: formData.community_id || null,
      category_id: formData.category_id || null,
      reminder_time: formData.reminder_time || null
    }

    try {
      const response = await fetch(`/api/events/${resolvedParams.eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast.success('Event updated successfully!')
        router.push(`/dashboard/events/${resolvedParams.eventId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update event')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      }

      // Clear community_id if is_community_event is unchecked
      if (name === 'is_community_event' && !newValue) {
        updated.community_id = ''
      }

      return updated
    })
  }

  if (isLoadingEvent) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading event...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Events
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-xl border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-blue-600" />
            Edit Event
          </h1>
          <p className="text-gray-600 mt-1">Update the event details below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="block w-full px-4 py-3 text-black border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 text-base"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="block w-full px-4 py-3 text-black border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 text-base resize-none"
              placeholder="Provide a detailed description of your event"
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Event Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_time" className="block text-sm font-semibold text-gray-800 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  id="start_time"
                  required
                  value={formData.start_time}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-black border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base bg-white"
                />
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-semibold text-gray-800 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  id="end_time"
                  required
                  value={formData.end_time}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-black border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-800 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              className="block w-full px-4 py-3 text-black border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 text-base"
              placeholder="Enter event location (e.g., Conference Room A, Online, etc.)"
            />
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  name="is_community_event"
                  id="is_community_event"
                  checked={formData.is_community_event}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_community_event" className="ml-3 block text-base font-medium text-gray-900">
                  This is a community event
                </label>
              </div>

              {formData.is_community_event && (
                <div className="ml-8 p-4 bg-white rounded-lg border border-blue-200">
                  <label htmlFor="community_id" className="block text-sm font-semibold text-gray-800 mb-2">
                    Select Community *
                  </label>
                  <select
                    name="community_id"
                    id="community_id"
                    required
                    value={formData.community_id}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 text-black border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-base bg-white"
                  >
                    <option value="" className="text-gray-500">Choose a community...</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id} className="text-black">
                        {community.name}
                      </option>
                    ))}
                  </select>
                  {communities.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      No communities available. Please contact an administrator.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  name="is_private"
                  id="is_private"
                  checked={formData.is_private}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_private" className="ml-3 block text-base font-medium text-gray-900">
                  Private event
                </label>
              </div>

              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  name="remind_me"
                  id="remind_me"
                  checked={formData.remind_me}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remind_me" className="ml-3 block text-base font-medium text-gray-900">
                  Set reminder
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard/events/${resolvedParams.eventId}`}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <Save className="h-5 w-5 mr-2" />
              {isLoading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}