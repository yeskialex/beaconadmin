'use client'

import { useState, useEffect } from 'react'
import { FileText, Eye, Trash2, Pin, Users, MessageSquare, Heart, Share } from 'lucide-react'

export default function PostsPage() {
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({ total: 0, official: 0, pinned: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()

      if (data.posts) {
        setPosts(data.posts)

        // Calculate stats from the data
        const total = data.posts.length
        const official = data.posts.filter(post => post.is_official).length
        const pinned = data.posts.filter(post => post.is_pinned).length

        setStats({ total, official, pinned })
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete the post "${postTitle || 'Untitled'}"?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove post from local state
        setPosts(prev => prev.filter(post => post.id !== postId))

        // Update stats
        const deletedPost = posts.find(p => p.id === postId)
        if (deletedPost) {
          setStats(prev => ({
            total: prev.total - 1,
            official: prev.official - (deletedPost.is_official ? 1 : 0),
            pinned: prev.pinned - (deletedPost.is_pinned ? 1 : 0)
          }))
        }

        alert('Post deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete post: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    }
  }

  const togglePinPost = async (postId: string, currentPinStatus: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_pinned: !currentPinStatus
        })
      })

      if (response.ok) {
        // Update post in local state
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, is_pinned: !currentPinStatus }
            : post
        ))

        // Update stats
        setStats(prev => ({
          ...prev,
          pinned: currentPinStatus ? prev.pinned - 1 : prev.pinned + 1
        }))
      } else {
        const error = await response.json()
        alert(`Failed to ${currentPinStatus ? 'unpin' : 'pin'} post: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error toggling post pin:', error)
      alert('Failed to update post. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Posts Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage community posts, moderate content, and handle reported posts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Posts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Pin className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Official Posts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.official}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Pin className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pinned Posts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.pinned}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">All Posts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Community
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts?.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {post.title && (
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {post.title}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {post.content}
                        </div>
                        {post.media_urls && post.media_urls.length > 0 && (
                          <div className="mt-1 text-xs text-blue-600">
                            📎 {post.media_urls.length} attachment(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {post.profiles?.avatar_url ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || ''}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {post.profiles?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {post.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.communities?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.like_count || 0}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.comment_count || 0}
                        </div>
                        <div className="flex items-center">
                          <Share className="h-4 w-4 mr-1" />
                          {post.share_count || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {post.is_official && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Official
                          </span>
                        )}
                        {post.is_pinned && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pinned
                          </span>
                        )}
                        {post.is_deleted && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                          onClick={() => alert('View post details functionality coming soon')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className={`${post.is_pinned ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'} transition-colors`}
                          title={post.is_pinned ? 'Unpin Post' : 'Pin Post'}
                          onClick={() => togglePinPost(post.id, post.is_pinned)}
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                          onClick={() => deletePost(post.id, post.title || post.content?.slice(0, 50))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) ?? []}
              </tbody>
            </table>
            {(!posts || posts.length === 0) && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No posts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No posts have been created yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}