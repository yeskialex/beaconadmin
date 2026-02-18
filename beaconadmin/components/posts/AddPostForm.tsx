'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Save, Loader2, Upload, X, Image, Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const postSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  community_id: z.string().min(1, 'Please select a community'),
  is_official: z.boolean(),
  is_pinned: z.boolean(),
})

type PostFormData = z.infer<typeof postSchema>

interface AddPostFormProps {
  onPostCreated?: () => void
  onCancel?: () => void
}

export default function AddPostForm({ onPostCreated, onCancel }: AddPostFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      community_id: '',
      is_official: true, // Default to official since it's an admin post
      is_pinned: false,
    },
  })

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch('/api/communities')
        if (response.ok) {
          const data = await response.json()
          setCommunities(data.communities || [])
        }
      } catch (error) {
        console.error('Error fetching communities:', error)
      }
    }

    fetchCommunities()
  }, [])

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    // Validate file sizes
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('Some images are too large (max 10MB each)')
      return
    }

    setMediaFiles(prev => [...prev, ...imageFiles])

    // Create preview URLs
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedMediaUrls(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('Some attachments are too large (max 50MB each)')
      return
    }

    setAttachmentFiles(prev => [...prev, ...files])
  }

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setUploadedMediaUrls(prev => prev.filter((_, i) => i !== index))
  }

  const removeAttachment = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  const onSubmit = async (data: PostFormData) => {
    setIsLoading(true)
    try {
      let allMediaUrls: string[] = []

      // Upload media files
      if (mediaFiles.length > 0) {
        const mediaUploadPromises = mediaFiles.map(file => uploadFile(file, 'post-media'))
        const mediaResults = await Promise.all(mediaUploadPromises)
        const successfulMediaUploads = mediaResults.filter(url => url !== null) as string[]

        if (successfulMediaUploads.length !== mediaFiles.length) {
          toast.error('Some media files failed to upload')
          setIsLoading(false)
          return
        }

        allMediaUrls = [...allMediaUrls, ...successfulMediaUploads]
      }

      // Upload attachment files
      if (attachmentFiles.length > 0) {
        const attachmentUploadPromises = attachmentFiles.map(file => uploadFile(file, 'post-attachments'))
        const attachmentResults = await Promise.all(attachmentUploadPromises)
        const successfulAttachmentUploads = attachmentResults.filter(url => url !== null) as string[]

        if (successfulAttachmentUploads.length !== attachmentFiles.length) {
          toast.error('Some attachment files failed to upload')
          setIsLoading(false)
          return
        }

        allMediaUrls = [...allMediaUrls, ...successfulAttachmentUploads]
      }

      // Create post
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          media_urls: allMediaUrls.length > 0 ? allMediaUrls : null,
          author_nickname: 'Admin', // Set nickname as Admin
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Post created successfully!')
        reset()
        setMediaFiles([])
        setAttachmentFiles([])
        setUploadedMediaUrls([])
        onPostCreated?.()
      } else {
        toast.error(result.error || 'Failed to create post')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="community_id" className="block text-sm font-medium text-gray-700">
            Community *
          </label>
          <select
            {...register('community_id')}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black"
          >
            <option value="">Select a community</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          {errors.community_id && (
            <p className="mt-1 text-sm text-red-600">{errors.community_id.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            {...register('title')}
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black placeholder-gray-600"
            placeholder="Enter post title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content *
          </label>
          <textarea
            {...register('content')}
            rows={6}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black placeholder-gray-600"
            placeholder="Write your post content here..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pictures
          </label>
          <div className="space-y-4">
            {uploadedMediaUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedMediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Image className="h-4 w-4 mr-2" />
              Add Pictures
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleMediaChange}
              />
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">Max 10MB per image</p>
        </div>

        {/* Attachments Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <div className="space-y-4">
            {attachmentFiles.length > 0 && (
              <div className="space-y-2">
                {attachmentFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Paperclip className="h-4 w-4 mr-2" />
              Add Attachments
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentChange}
              />
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">Max 50MB per file</p>
        </div>

        {/* Post Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Post Options</h3>
          <div className="flex items-center">
            <input
              {...register('is_official')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Official Post (Posted by Admin)
            </label>
          </div>
          <div className="flex items-center">
            <input
              {...register('is_pinned')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Pin Post (Show at top)
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Post
            </>
          )}
        </button>
      </div>
    </form>
  )
}