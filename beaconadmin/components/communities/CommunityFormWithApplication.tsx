'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Save, Loader2, Upload, X, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Settings, FileText, HelpCircle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  // Application settings
  join_description: z.string().min(10, 'Join page description must be at least 10 characters'),
  join_cover_url: z.string().optional(),
  join_button_text: z.string().optional(),
  guidelines_text: z.string().min(20, 'Guidelines must be at least 20 characters'),
  requires_agreement: z.boolean(),
  agreement_prompt: z.string().optional(),
})

type CommunityFormData = z.infer<typeof communitySchema>

interface ApplicationQuestion {
  question_text: string
  question_order: number
  is_required: boolean
  placeholder_text?: string
  max_length: number
}

interface CommunityFormWithApplicationProps {
  initialData?: Partial<CommunityFormData & {
    id: string
    questions?: ApplicationQuestion[]
  }>
  isEditing?: boolean
  isSuperAdmin?: boolean
}

export default function CommunityFormWithApplication({ initialData, isEditing = false, isSuperAdmin = false }: CommunityFormWithApplicationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar_url || '')
  const [coverPreview, setCoverPreview] = useState<string>(initialData?.cover_url || '')
  const [currentStep, setCurrentStep] = useState(1)
  const [questions, setQuestions] = useState<ApplicationQuestion[]>(
    initialData?.questions || [
      {
        question_text: 'Why do you want to join this community?',
        question_order: 1,
        is_required: true,
        placeholder_text: 'Share your motivation for joining...',
        max_length: 500
      }
    ]
  )
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
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
      join_description: initialData?.join_description || '',
      join_cover_url: initialData?.join_cover_url || '',
      join_button_text: initialData?.join_button_text || 'Apply to Join',
      guidelines_text: initialData?.guidelines_text || '',
      requires_agreement: initialData?.requires_agreement ?? true,
      agreement_prompt: initialData?.agreement_prompt || 'Do you agree to follow the group guidelines and respect members?',
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

  const addQuestion = () => {
    const newQuestion: ApplicationQuestion = {
      question_text: '',
      question_order: questions.length + 1,
      is_required: true,
      placeholder_text: '',
      max_length: 500
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('You must have at least one application question')
      return
    }
    const updatedQuestions = questions.filter((_, i) => i !== index)
    updatedQuestions.forEach((q, i) => {
      q.question_order = i + 1
    })
    setQuestions(updatedQuestions)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) ||
        (direction === 'down' && index === questions.length - 1)) {
      return
    }

    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp

    newQuestions.forEach((q, i) => {
      q.question_order = i + 1
    })

    setQuestions(newQuestions)
  }

  const updateQuestion = (index: number, field: keyof ApplicationQuestion, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    }
    setQuestions(updatedQuestions)
  }

  const validateQuestions = () => {
    const validQuestions = questions.filter(q => q.question_text && q.question_text.trim())
    if (validQuestions.length === 0) {
      toast.error('You must have at least one valid question')
      return false
    }
    return true
  }

  const nextStep = async () => {
    // Validate current step
    if (currentStep === 1) {
      const isValid = await trigger(['name', 'description', 'scope', 'university_id'])
      if (!isValid) {
        toast.error('Please fill in all required fields')
        return
      }
    } else if (currentStep === 2) {
      const isValid = await trigger(['join_description', 'guidelines_text'])
      if (!isValid) {
        toast.error('Please fill in the join description and guidelines')
        return
      }
    } else if (currentStep === 3) {
      if (!validateQuestions()) {
        return
      }
    }
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: CommunityFormData) => {
    // Validate questions
    if (!validateQuestions()) {
      return
    }

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
        : '/api/communities/create-with-application'

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          university_id: data.scope === 'global' ? null : data.university_id,
          questions: questions.filter(q => q.question_text && q.question_text.trim())
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(isEditing ? 'Community updated successfully!' : 'Community created successfully with application settings!')
        router.push('/dashboard/communities')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save community')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const stepTitles = ['Basic Information', 'Application Settings', 'Application Questions', 'Review & Create']

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 4 || isEditing) {
      handleSubmit(onSubmit)(e)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Progress Steps */}
      {!isEditing && (
        <div className="mb-8">
          <nav className="flex items-center justify-center">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center">
                <button
                  type="button"
                  className={`flex items-center px-4 py-2 text-sm font-medium ${
                    currentStep === index + 1
                      ? 'text-blue-600'
                      : currentStep > index + 1
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                  onClick={() => {
                    if (currentStep > index + 1) {
                      setCurrentStep(index + 1)
                    }
                  }}
                  disabled={currentStep < index + 1}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === index + 1
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : currentStep > index + 1
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="ml-2">{title}</span>
                </button>
                {index < stepTitles.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Basic Community Information</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Community Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 text-black placeholder-gray-600"
                placeholder="e.g., Photography Club"
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
                placeholder="Describe your community's purpose and activities"
              />
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
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null)
                        setAvatarPreview('')
                        setValue('avatar_url', '')
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Avatar
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Community Scope</label>
              <select
                {...register('scope')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black"
              >
                <option value="global">Global</option>
                <option value="institutional">Institutional</option>
              </select>
            </div>

            {scope === 'institutional' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">University</label>
                <select
                  {...register('university_id')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black"
                >
                  <option value="">Select University</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>{uni.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center">
              <input
                {...register('is_private')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Private Community (Requires approval to join)
              </label>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center">
                <input
                  {...register('is_default')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
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
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Restrict Post Creation (Only admins can create posts)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('comment_restrict')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Restrict Comments (Only admins can comment on posts)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('event_restrict')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Restrict Event Creation (Only admins can create events)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Application Settings */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Join Page & Guidelines</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Page Description *
            </label>
            <textarea
              {...register('join_description')}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-600"
              placeholder="Welcome message shown to users before they apply to join..."
            />
            {errors.join_description && (
              <p className="mt-1 text-sm text-red-600">{errors.join_description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Button Text
            </label>
            <input
              {...register('join_button_text')}
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-600"
              placeholder="Apply to Join"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Guidelines *
            </label>
            <textarea
              {...register('guidelines_text')}
              rows={6}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-600"
              placeholder="1. Be respectful to all members&#10;2. No spam or self-promotion&#10;3. Keep discussions relevant..."
            />
            {errors.guidelines_text && (
              <p className="mt-1 text-sm text-red-600">{errors.guidelines_text.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                {...register('requires_agreement')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Require users to agree to guidelines
              </span>
            </label>

            {watch('requires_agreement') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agreement Prompt
                </label>
                <input
                  {...register('agreement_prompt')}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-600"
                  placeholder="Do you agree to follow the group guidelines?"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Application Questions */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Application Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Create questions that applicants must answer when applying to join your community.
          </p>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text *
                    </label>
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black placeholder-gray-600"
                      placeholder="Why do you want to join this community?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={question.placeholder_text || ''}
                        onChange={(e) => updateQuestion(index, 'placeholder_text', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-600"
                        placeholder="Hint text..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Length
                      </label>
                      <input
                        type="number"
                        value={question.max_length}
                        onChange={(e) => updateQuestion(index, 'max_length', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black"
                        min="50"
                        max="2000"
                      />
                    </div>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={question.is_required}
                      onChange={(e) => updateQuestion(index, 'is_required', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Required question
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Review Your Community Settings</h2>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-600 mt-1">Name: {watch('name')}</p>
              <p className="text-sm text-gray-600">Scope: {watch('scope')}</p>
              <p className="text-sm text-gray-600">Private: {watch('is_private') ? 'Yes' : 'No'}</p>
              {isSuperAdmin && (
                <p className="text-sm text-gray-600">Default Community: {watch('is_default') ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Application Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Has join description: Yes</p>
              <p className="text-sm text-gray-600">Has guidelines: Yes</p>
              <p className="text-sm text-gray-600">Requires agreement: {watch('requires_agreement') ? 'Yes' : 'No'}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Application Questions</h3>
              <p className="text-sm text-gray-600 mt-1">Number of questions: {questions.length}</p>
              <p className="text-sm text-gray-600">Required questions: {questions.filter(q => q.is_required).length}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-700">
              Once created, users will need to apply to join your community by answering the questions you've configured.
              You can review and approve/reject applications from the dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && !isEditing && (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>

          {currentStep < 4 && !isEditing ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
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
                  {isEditing ? 'Update Community' : 'Create Community'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}