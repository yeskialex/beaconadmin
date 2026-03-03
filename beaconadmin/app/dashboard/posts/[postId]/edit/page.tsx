'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import EditPostForm from '@/components/posts/EditPostForm'

interface PostData {
  id: string
  title: string
  content: string
  community_id: string
  is_official: boolean
  is_pinned: boolean
  media_urls?: string[]
  community?: {
    id: string
    name: string
  }
}

export default function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [post, setPost] = useState<PostData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [resolvedParams.postId])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.postId}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data.post)
      } else {
        toast.error('Failed to fetch post')
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading post...</span>
          </div>
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
          <div>
            <h1 className="text-3xl font-bold text-black">Edit Post</h1>
            <p className="text-sm text-gray-600 mt-1">Update the post details below</p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <EditPostForm
            post={post}
            onPostUpdated={() => {
              toast.success('Post updated successfully!')
              router.push('/dashboard/posts')
            }}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  )
}