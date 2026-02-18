'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Save, Loader2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CommunityApplicationForm from './CommunityApplicationForm'

const communitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
  is_private: z.boolean(),
  is_active: z.boolean(),
  is_default: z.boolean(),
  scope: z.enum(['global', 'institutional']),
  university_id: z.string().optional().nullable(),
  post_restrict: z.boolean(),
  comment_restrict: z.boolean(),
  event_restrict: z.boolean(),
})

type CommunityFormData = z.infer<typeof communitySchema>

interface CommunityFormProps {
  initialData?: Partial<CommunityFormData & { id: string }>
  isEditing?: boolean
  isSuperAdmin?: boolean
}

export default function CommunityForm({ initialData, isEditing = false, isSuperAdmin = false }: CommunityFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar_url || '')
  const [coverPreview, setCoverPreview] = useState<string>(initialData?.cover_url || '')
  const [showApplicationSettings, setShowApplicationSettings] = useState(false)
  const [newCommunityId, setNewCommunityId] = useState<string | null>(null)
  const supabase = createClient()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      avatar_url: initialData?.avatar_url || '',
      cover_url: initialData?.cover_url || '',
      is_private: initialData?.is_private || false,
      is_active: initialData?.is_active ?? true,
      is_default: initialData?.is_default || false,
      scope: initialData?.scope || 'global',
      university_id: initialData?.university_id || '',
      post_restrict: initialData?.post_restrict || false,
      comment_restrict: initialData?.comment_restrict || false,
      event_restrict: initialData?.event_restrict || false,
    },
  })

  const scope = watch('scope')

  // Fetch universities for institutional communities
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities')
        if (response.ok) {
          const data = await response.json()
          setUniversities(data.universities)
        }
      } catch (error) {
        console.error('Error fetching universities:', error)
      }
    }
    
    if (scope === 'institutional') {
      fetchUniversities()
    }
  }, [scope])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar image must be less than 5MB')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover image must be less than 10MB')
        return
      }
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError, data } = await supabase.storage
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
      console.error('Error uploading image:', error)
      return null
    }
  }

  const onSubmit = async (data: CommunityFormData) => {
    setIsLoading(true)
    try {
      let avatarUrl = data.avatar_url
      let coverUrl = data.cover_url

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const uploadedAvatarUrl = await uploadImage(avatarFile, 'community-avatars')
        if (uploadedAvatarUrl) {
          avatarUrl = uploadedAvatarUrl
        } else {
          toast.error('Failed to upload avatar image')
          setIsLoading(false)
          return
        }
      }

      // Upload cover if a new file was selected
      if (coverFile) {
        const uploadedCoverUrl = await uploadImage(coverFile, 'community-covers')
        if (uploadedCoverUrl) {
          coverUrl = uploadedCoverUrl
        } else {
          toast.error('Failed to upload cover image')
          setIsLoading(false)
          return
        }
      }

      const endpoint = isEditing
        ? `/api/communities/${initialData?.id}`
        : '/api/communities'

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          university_id: data.scope === 'global' ? null : data.university_id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        if (!isEditing && result.community) {
          // For new communities, show application settings
          setNewCommunityId(result.community.id)
          setShowApplicationSettings(true)
          toast.success('Community created! Now configure application settings.')
        } else {
          toast.success(isEditing ? 'Community updated successfully!' : 'Community created successfully!')
          router.push('/dashboard/communities')
          router.refresh()
        }
      } else {
        toast.error(result.error || 'Failed to save community')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Community Name
          </label>
          <input
            {...register('name')}
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black placeholder-gray-600"
            placeholder="e.g., Photography Club, Korean Students Association, Study Group"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black placeholder-gray-600"
            placeholder="Describe your community's purpose, activities, and who should join (e.g., 'A welcoming space for photography enthusiasts to share tips, organize photo walks, and showcase their work')"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
            Community Avatar
          </label>
          <div className="mt-1 flex items-center space-x-4">
            {avatarPreview && (
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarPreview('')
                    setValue('avatar_url', '')
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Square image recommended (400x400px), max 5MB</p>
          <input type="hidden" {...register('avatar_url')} value={avatarPreview} />
        </div>

        <div>
          <label htmlFor="cover" className="block text-sm font-medium text-gray-700">
            Community Cover
          </label>
          <div className="mt-1 space-y-4">
            {coverPreview && (
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-md border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null)
                    setCoverPreview('')
                    setValue('cover_url', '')
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <label
              htmlFor="cover-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              {coverPreview ? 'Change Cover' : 'Upload Cover'}
            </label>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Wide image recommended (1200x300px), max 10MB</p>
          <input type="hidden" {...register('cover_url')} value={coverPreview} />
        </div>

        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
            Scope
          </label>
          <select
            {...register('scope')}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black"
          >
            <option value="global">Global (Available to all users)</option>
            <option value="institutional">Institutional (University-specific)</option>
          </select>
        </div>

        {scope === 'institutional' && (
          <div>
            <label htmlFor="university_id" className="block text-sm font-medium text-gray-700">
              University
            </label>
            <select
              {...register('university_id')}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black"
            >
              <option value="" className="text-black">Select a university (required for institutional communities)</option>
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center">
          <input
            {...register('is_private')}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_private" className="ml-2 block text-sm text-gray-900">
            Private Community
          </label>
        </div>

        <div className="flex items-center">
          <input
            {...register('is_active')}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Active Community
          </label>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center">
            <input
              {...register('is_default')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
              Default Community (Set as default for new users)
            </label>
          </div>
        )}

        <div className="sm:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Content Restrictions</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                {...register('post_restrict')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Restrict Post Creation (Only admins can create posts)
              </label>
            </div>

            <div className="flex items-center">
              <input
                {...register('comment_restrict')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Restrict Comments (Only admins can comment on posts)
              </label>
            </div>

            <div className="flex items-center">
              <input
                {...register('event_restrict')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Restrict Event Creation (Only admins can create events)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Application Settings - Show for existing communities or after creating new one */}
      {((isEditing && initialData?.id) || (showApplicationSettings && newCommunityId)) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {!isEditing ? 'Configure Application Settings (Optional)' : 'Application Settings'}
          </h3>
          <CommunityApplicationForm
            communityId={(isEditing ? initialData?.id : newCommunityId) as string}
            isEditing={isEditing}
          />
          {!isEditing && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">
                You can configure how users apply to join your community. These settings are optional and can be updated later.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {showApplicationSettings && !isEditing ? (
          <>
            <button
              type="button"
              onClick={() => {
                router.push('/dashboard/communities')
                router.refresh()
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Skip for Now
            </button>
            <button
              type="button"
              onClick={() => {
                router.push('/dashboard/communities')
                router.refresh()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Finish Setup
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || showApplicationSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Community' : 'Create Community'}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </form>
  )
}