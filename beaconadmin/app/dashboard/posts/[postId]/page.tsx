'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageSquare, Share, Pin, Eye, User, Calendar, Flag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface PostDetail {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_deleted: boolean
  is_official: boolean
  like_count: number
  comment_count: number
  share_count: number
  media_urls: string[]
  author: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  community: {
    id: string
    name: string
    avatar_url?: string
  }
  comments?: Comment[]
}

interface Comment {
  id: string
  content: string
  created_at: string
  author: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export default function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [post, setPost] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPostDetail()
  }, [resolvedParams.postId])

  const fetchPostDetail = async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.postId}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data.post)
      } else {
        toast.error('Failed to fetch post details')
        router.push('/dashboard/posts')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Error loading post')
      router.push('/dashboard/posts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!post) return

    const confirmMessage = post.is_deleted
      ? 'This post is already marked as deleted. Do you want to permanently delete it?'
      : `Are you sure you want to delete the post "${post.title}"?`

    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Post deleted successfully')
        router.push('/dashboard/posts')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Error deleting post')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePin = async () => {
    if (!post) return

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !post.is_pinned })
      })

      if (response.ok) {
        setPost(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null)
        toast.success(post.is_pinned ? 'Post unpinned' : 'Post pinned')
      } else {
        toast.error('Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('Error updating post')
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

  if (!post) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Post not found</p>
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-black">Post Details</h1>
        </div>

        {/* Post Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Post Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/users/${post.author.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {post.author.full_name}
                    </Link>
                    {post.is_official && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{post.author.email}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-400">
                      in {' '}
                      <Link
                        href={`/dashboard/communities/${post.community.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {post.community.name}
                      </Link>
                    </span>
                    <span className="text-xs text-gray-400">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                    {post.updated_at !== post.created_at && (
                      <span className="text-xs text-gray-400">
                        (edited {new Date(post.updated_at).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePin}
                  className={`p-2 rounded-lg transition-colors ${
                    post.is_pinned
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={post.is_pinned ? 'Unpin post' : 'Pin post'}
                >
                  <Pin className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                 
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status Indicators */}
            {(post.is_pinned || post.is_deleted) && (
              <div className="flex items-center space-x-2 mt-3">
                {post.is_pinned && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </span>
                )}
                {post.is_deleted && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Deleted
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {post.media_urls.map((url, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md mb-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Post Stats */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-6">
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {post.like_count} likes
                </span>
                <span className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {post.comment_count} comments
                </span>
                <span className="flex items-center">
                  <Share className="h-4 w-4 mr-1" />
                  {post.share_count} shares
                </span>
              </div>
              <span>Post ID: {post.id}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {post.comments && post.comments.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Comments ({post.comments.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {post.comments.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex space-x-3">
                    {comment.author.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt={comment.author.full_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{comment.author.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}