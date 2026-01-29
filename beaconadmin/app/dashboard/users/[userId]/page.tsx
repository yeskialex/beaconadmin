'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Calendar, Users, MessageSquare, Heart, Eye, Trash2, Pin } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  bio?: string
  created_at: string
}

interface UserPost {
  id: string
  title: string
  content: string
  created_at: string
  is_pinned: boolean
  is_deleted: boolean
  community: {
    name: string
    id: string
  }
  like_count: number
  comment_count: number
}

interface UserEvent {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  is_private: boolean
  is_community_event: boolean
  created_at: string
  community: {
    name: string
    id: string
  } | null
}

interface UserCommunity {
  id: string
  name: string
  description?: string
  avatar_url?: string
  role: string
  joined_at: string
  is_private: boolean
  member_count: number
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<UserPost[]>([])
  const [events, setEvents] = useState<UserEvent[]>([])
  const [communities, setCommunities] = useState<UserCommunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'communities'>('posts')

  useEffect(() => {
    fetchUserData()
  }, [resolvedParams.userId])

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const userResponse = await fetch(`/api/users/${resolvedParams.userId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
      }

      // Fetch user posts
      const postsResponse = await fetch(`/api/users/${resolvedParams.userId}/posts`)
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        setPosts(postsData.posts)
      }

      // Fetch user events
      const eventsResponse = await fetch(`/api/users/${resolvedParams.userId}/events`)
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.events)
      }

      // Fetch user communities
      const communitiesResponse = await fetch(`/api/users/${resolvedParams.userId}/communities`)
      if (communitiesResponse.ok) {
        const communitiesData = await communitiesResponse.json()
        setCommunities(communitiesData.communities)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Error loading user data')
    } finally {
      setIsLoading(false)
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

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">User not found</p>
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
          <h1 className="text-3xl font-bold text-black">User Details</h1>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-20 w-20 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
              <p className="text-gray-600 mb-2">{user.email}</p>
              {user.bio && (
                <p className="text-gray-700 mb-3">{user.bio}</p>
              )}
              <p className="text-sm text-gray-500">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{events.length}</div>
                  <div className="text-sm text-gray-500">Events</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{communities.length}</div>
                  <div className="text-sm text-gray-500">Communities</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {(['posts', 'events', 'communities'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab} ({tab === 'posts' ? posts.length : tab === 'events' ? events.length : communities.length})
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
                    <p>No posts created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{post.title}</h3>
                              {post.is_pinned && <Pin className="h-4 w-4 text-blue-500" />}
                              {post.is_deleted && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Deleted</span>}
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>in {post.community?.name || 'Unknown Community'}</span>
                              <span className="flex items-center">
                                <Heart className="h-4 w-4 mr-1" />
                                {post.like_count || 0}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {post.comment_count || 0}
                              </span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
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
                    <p>No events created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                              <div>
                                <span className="font-medium">Community:</span> {event.community?.name || (event.is_community_event ? 'Unknown Community' : 'Personal Event')}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {event.is_private ? 'Private' : 'Public'} {event.is_community_event ? 'Community Event' : 'Personal Event'}
                              </div>
                              <div>
                                <span className="font-medium">Start:</span> {new Date(event.start_time).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">End:</span> {new Date(event.end_time).toLocaleString()}
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

            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div>
                {communities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No communities joined yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communities.map((community) => (
                      <div key={community.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          {community.avatar_url ? (
                            <img
                              src={community.avatar_url}
                              alt={community.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{community.name}</h3>
                            {community.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{community.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded-full ${
                                community.is_private
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {community.is_private ? 'Private' : 'Public'}
                              </span>
                              <span>{community.member_count} members</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                Role: <span className="font-medium capitalize">{community.role}</span>
                              </span>
                              <span className="text-xs text-gray-500">
                                Joined {new Date(community.joined_at).toLocaleDateString()}
                              </span>
                            </div>
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
      </div>
    </div>
  )
}