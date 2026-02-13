'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0, 'Display order must be 0 or greater'),
})

type BannerFormData = z.infer<typeof bannerSchema>

interface Banner {
  id: string
  title: string
  description?: string
  image_url: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
  admin_users: {
    full_name?: string
    email: string
  }
}

export default function EditBannerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
  })


  useEffect(() => {
    fetchBanner()
  }, [params.id])

  const fetchBanner = async () => {
    try {
      const response = await fetch(`/api/banners/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch banner')
      }

      setBanner(data.banner)
      setImageUrl(data.banner.image_url)
      setImagePreview(data.banner.image_url)

      // Populate form with banner data
      reset({
        title: data.banner.title,
        description: data.banner.description || '',
        is_active: data.banner.is_active,
        display_order: data.banner.display_order,
      })
    } catch (error) {
      console.error('Error fetching banner:', error)
      toast.error('Failed to load banner')
      router.push('/dashboard/banners')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/banners/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setImageUrl(data.url)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      if (banner) {
        setImagePreview(banner.image_url)
      }
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    if (banner) {
      setImageUrl(banner.image_url)
      setImagePreview(banner.image_url)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: BannerFormData) => {
    if (!imageUrl) {
      toast.error('Please upload a banner image')
      return
    }


    setSubmitting(true)
    try {
      const payload = {
        ...data,
        image_url: imageUrl,
        description: data.description || null,
      }

      const response = await fetch(`/api/banners/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update banner')
      }

      toast.success('Banner updated successfully')
      router.push('/dashboard/banners')
    } catch (error) {
      console.error('Error updating banner:', error)
      toast.error('Failed to update banner')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Banner not found</h3>
        <p className="mt-1 text-sm text-gray-500">The banner you're looking for doesn't exist.</p>
        <Link
          href="/dashboard/banners"
          className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Banners
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/banners"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Banner</h1>
          <p className="text-gray-600">Update banner: {banner.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Banner Image *
              </label>

              <div className="space-y-4">
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling!.style.display = 'flex'
                    }}
                  />
                  <div
                    className="w-full h-full bg-gray-200 items-center justify-center hidden"
                  >
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    Change Image
                  </button>

                  {imageUrl !== banner.image_url && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {uploading && (
                  <div className="text-sm text-blue-600">Uploading new image...</div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black"
                  placeholder="e.g., Welcome to Beacon"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black"
                  placeholder="Optional description for internal use"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>



            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Display Settings</h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">
                    Display Order
                  </label>
                  <input
                    {...register('display_order', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black"
                  />
                  <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
                  {errors.display_order && (
                    <p className="mt-1 text-sm text-red-600">{errors.display_order.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      {...register('is_active')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Inactive banners are not shown in the app</p>
                </div>
              </div>
            </div>

          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
            <Link
              href="/dashboard/banners"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update Banner'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}