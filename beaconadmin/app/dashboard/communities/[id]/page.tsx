'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Calendar, MessageSquare, Heart, Share, Pin, Eye, User, MapPin, Globe, Lock, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CommunityDetail {
  id: string
  name: string
  description: string
  avatar_url?: string
  cover_image_url?: string
  is_private: boolean
  member_count: number
  post_count: number
  event_count: number
  location?: string
  website_url?: string
  rules?: string
  created_at: string
  updated_at: string
  created_by: string
}

interface CommunityPost {
  id: string
  title: string
  content: string
  created_at: string
  is_pinned: boolean
  is_deleted: boolean
  is_official: boolean
  like_count: number
  comment_count: number
  share_count: number
  author: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface CommunityEvent {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  is_private: boolean
  created_at: string
  created_by: string
  author: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface CommunityMember {
  id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
  user: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'members'>('posts')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchCommunityData()
  }, [resolvedParams.id])

  const fetchCommunityData = async () => {
    try {
      // Fetch community details
      const [communityRes, postsRes, eventsRes, membersRes] = await Promise.all([
        fetch(`/api/communities/${resolvedParams.id}`),
        fetch(`/api/communities/${resolvedParams.id}/posts`),
        fetch(`/api/communities/${resolvedParams.id}/events`),
        fetch(`/api/communities/${resolvedParams.id}/members`)
      ])

      if (communityRes.ok) {
        const communityData = await communityRes.json()
        setCommunity(communityData.community)
      } else {
        toast.error('Failed to fetch community details')
        router.push('/dashboard/communities')
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts || [])
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.members || [])
      }
    } catch (error) {
      console.error('Error fetching community data:', error)
      toast.error('Error loading community data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!community) return

    if (!confirm(`Are you sure you want to delete the community "${community.name}"? This will delete all posts, events, and member data permanently.`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Community deleted successfully')
        router.push('/dashboard/communities')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete community')
      }
    } catch (error) {
      console.error('Error deleting community:', error)
      toast.error('Error deleting community')
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'moderator':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-blue-100 text-blue-800'
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

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-black">Community Details</h1>
        </div>

        {/* Community Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {/* Cover Image */}
          {community.cover_image_url && (
            <div className="h-48 w-full bg-gray-200 rounded-t-xl overflow-hidden">
              <img
                src={community.cover_image_url}
                alt="Community cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {community.avatar_url ? (
                    <img
                      src={community.avatar_url}
                      alt={community.name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white"
                      style={{ marginTop: community.cover_image_url ? '-40px' : '0' }}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white"
                         style={{ marginTop: community.cover_image_url ? '-40px' : '0' }}>
                      <Users className="h-10 w-10 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1" style={{ marginTop: community.cover_image_url ? '-20px' : '0' }}>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-black">{community.name}</h2>
                    {community.is_private ? (
                      <Lock className="h-5 w-5 text-gray-500" title="Private Community" />
                    ) : (
                      <Globe className="h-5 w-5 text-green-500" title="Public Community" />
                    )}
                  </div>
                  {community.description && (
                    <p className="text-black mb-3">{community.description}</p>
                  )}
                  <div className="flex items-center space-x-6 text-sm text-black">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {community.member_count} members
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {community.post_count || posts.length} posts
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {community.event_count || events.length} events
                    </div>
                  </div>
                  {community.location && (
                    <div className="flex items-center mt-2 text-sm text-black">
                      <MapPin className="h-4 w-4 mr-1" />
                      {community.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  title="Delete community"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Members</p>
                <p className="text-2xl font-bold text-black">{members.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Posts</p>
                <p className="text-2xl font-bold text-black">{posts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">Events</p>
                <p className="text-2xl font-bold text-black">{events.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {(['posts', 'events', 'members'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab} ({tab === 'posts' ? posts.length : tab === 'events' ? events.length : members.length})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No posts in this community yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              {post.author.avatar_url ? (
                                <img
                                  src={post.author.avatar_url}
                                  alt={post.author.full_name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Link
                                    href={`/dashboard/users/${post.author.id}`}
                                    className="font-medium text-black hover:text-blue-600"
                                  >
                                    {post.author.full_name}
                                  </Link>
                                  {post.is_official && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Official
                                    </span>
                                  )}
                                  {post.is_pinned && <Pin className="h-4 w-4 text-blue-500" />}
                                  {post.is_deleted && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Deleted</span>
                                  )}
                                </div>
                                <p className="text-xs text-black">{new Date(post.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <h3 className="font-semibold text-black mb-2">{post.title}</h3>
                            <p className="text-black mb-3 line-clamp-2">{post.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-black">
                              <span className="flex items-center">
                                <Heart className="h-4 w-4 mr-1" />
                                {post.like_count || 0}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {post.comment_count || 0}
                              </span>
                              <span className="flex items-center">
                                <Share className="h-4 w-4 mr-1" />
                                {post.share_count || 0}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/posts/${post.id}`}
                            className="text-blue-600 hover:text-blue-900 p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No events in this community yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              {event.author.avatar_url ? (
                                <img
                                  src={event.author.avatar_url}
                                  alt={event.author.full_name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                              )}
                              <div>
                                <Link
                                  href={`/dashboard/users/${event.author.id}`}
                                  className="font-medium text-black hover:text-blue-600"
                                >
                                  {event.author.full_name}
                                </Link>
                                <p className="text-xs text-black">{new Date(event.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <h3 className="font-semibold text-black mb-2">{event.title}</h3>
                            <p className="text-black mb-3 line-clamp-2">{event.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm text-black">
                              <div>
                                <span className="font-medium">Start:</span> {new Date(event.start_time).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">End:</span> {new Date(event.end_time).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {formatDuration(event.start_time, event.end_time)}
                              </div>
                              <div>
                                <span className="font-medium">Privacy:</span> {event.is_private ? 'Private' : 'Public'}
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/events/${event.id}`}
                            className="text-blue-600 hover:text-blue-900 p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No members in this community yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {member.user.avatar_url ? (
                            <img
                              src={member.user.avatar_url}
                              alt={member.user.full_name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/dashboard/users/${member.user_id}`}
                                className="font-medium text-black hover:text-blue-600"
                              >
                                {member.user.full_name}
                              </Link>
                              <span className={`text-xs px-2 py-1 rounded-full capitalize ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                            </div>
                            <p className="text-sm text-black">{member.user.email}</p>
                            <p className="text-xs text-black">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Community Info Footer */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between text-sm text-black">
            <div className="flex items-center space-x-4">
              <span>Community ID: {community.id}</span>
              <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
              {community.updated_at !== community.created_at && (
                <span>Updated {new Date(community.updated_at).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {community.is_private ? (
                <span className="flex items-center">
                  <Lock className="h-4 w-4 mr-1" />
                  Private Community
                </span>
              ) : (
                <span className="flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Public Community
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}