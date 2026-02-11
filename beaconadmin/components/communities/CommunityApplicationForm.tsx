'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, FileText, Users, Settings, HelpCircle, AlertCircle, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ApplicationQuestion {
  id?: string
  question_text: string
  question_order: number
  is_required: boolean
  placeholder_text?: string
  max_length: number
}

interface CommunityApplicationFormProps {
  communityId: string
  isEditing?: boolean
}

export default function CommunityApplicationForm({ communityId, isEditing = false }: CommunityApplicationFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'guidelines' | 'questions'>('settings')

  // Join Page Settings
  const [joinDescription, setJoinDescription] = useState('')
  const [joinCoverUrl, setJoinCoverUrl] = useState('')
  const [joinButtonText, setJoinButtonText] = useState('Join Community')
  const [joinCoverFile, setJoinCoverFile] = useState<File | null>(null)
  const [joinCoverPreview, setJoinCoverPreview] = useState<string>('')

  // Guidelines
  const [guidelinesText, setGuidelinesText] = useState('')
  const [requiresAgreement, setRequiresAgreement] = useState(false)
  const [agreementPrompt, setAgreementPrompt] = useState('Do you agree to follow the group guidelines and respect members?')

  // Questions
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([])

  useEffect(() => {
    if (isEditing && communityId) {
      fetchExistingData()
    }
  }, [communityId, isEditing])

  const fetchExistingData = async () => {
    try {
      setLoading(true)

      // Fetch join info
      const { data: joinInfo } = await supabase
        .from('community_join_info')
        .select('*')
        .eq('community_id', communityId)
        .single()

      if (joinInfo) {
        setJoinDescription(joinInfo.description || '')
        setJoinCoverUrl(joinInfo.cover_url || '')
        setJoinCoverPreview(joinInfo.cover_url || '')
        setJoinButtonText(joinInfo.button_text || 'Join Community')
      }

      // Fetch guidelines
      const { data: guidelines } = await supabase
        .from('community_guidelines')
        .select('*')
        .eq('community_id', communityId)
        .single()

      if (guidelines) {
        setGuidelinesText(guidelines.guidelines_text || '')
        setRequiresAgreement(guidelines.requires_agreement || false)
        setAgreementPrompt(guidelines.agreement_prompt || 'Do you agree to follow the group guidelines and respect members?')
      }

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('community_questions')
        .select('*')
        .eq('community_id', communityId)
        .order('question_order')

      if (questionsData && questionsData.length > 0) {
        setQuestions(questionsData)
      }
    } catch (error) {
      console.error('Error fetching application data:', error)
      toast.error('Failed to load application settings')
    } finally {
      setLoading(false)
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
    const updatedQuestions = questions.filter((_, i) => i !== index)
    // Reorder remaining questions
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

    // Swap questions
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp

    // Update order numbers
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

  const handleJoinCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Cover image must be less than 10MB')
        return
      }
      setJoinCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setJoinCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadJoinCoverImage = async (): Promise<string | null> => {
    if (!joinCoverFile) return joinCoverUrl

    try {
      const fileExt = joinCoverFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError, data } = await supabase.storage
        .from('community-covers')
        .upload(filePath, joinCoverFile)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('community-covers')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading join cover image:', error)
      toast.error('Failed to upload cover image')
      return null
    }
  }

  const saveApplicationSettings = async () => {
    try {
      setLoading(true)

      // Upload cover image if a new file was selected
      let uploadedCoverUrl = joinCoverUrl
      if (joinCoverFile) {
        const newCoverUrl = await uploadJoinCoverImage()
        if (newCoverUrl) {
          uploadedCoverUrl = newCoverUrl
          setJoinCoverUrl(newCoverUrl) // Update the URL state
        } else {
          setLoading(false)
          return
        }
      }

      // Only save if there's actual data to save
      const hasJoinInfo = joinDescription || uploadedCoverUrl || (joinButtonText && joinButtonText !== 'Join Community')
      const hasGuidelines = guidelinesText
      const hasQuestions = questions.length > 0 && questions.some(q => q.question_text)

      // Save join info if provided
      if (hasJoinInfo) {
        const joinInfoData = {
          community_id: communityId,
          description: joinDescription,
          cover_url: uploadedCoverUrl,
          button_text: joinButtonText || 'Join Community'
        }

        const { error: joinError } = await supabase
          .from('community_join_info')
          .upsert(joinInfoData, {
            onConflict: 'community_id'
          })

        if (joinError) throw joinError
      }

      // Save guidelines if provided
      if (hasGuidelines) {
        const guidelinesData = {
          community_id: communityId,
          guidelines_text: guidelinesText,
          requires_agreement: requiresAgreement,
          agreement_prompt: agreementPrompt || 'Do you agree to follow the group guidelines and respect members?'
        }

        const { error: guidelinesError } = await supabase
          .from('community_guidelines')
          .upsert(guidelinesData, {
            onConflict: 'community_id'
          })

        if (guidelinesError) throw guidelinesError
      }

      // Handle questions
      if (hasQuestions) {
        // Filter out empty questions
        const validQuestions = questions.filter(q => q.question_text && q.question_text.trim())

        if (validQuestions.length > 0) {
          // Delete existing questions
          await supabase
            .from('community_questions')
            .delete()
            .eq('community_id', communityId)

          // Insert new questions
          const questionsData = validQuestions.map((q, index) => ({
            community_id: communityId,
            question_text: q.question_text.trim(),
            question_order: index + 1,
            is_required: q.is_required,
            placeholder_text: q.placeholder_text?.trim() || null,
            max_length: q.max_length || 500
          }))

          const { error: questionsError } = await supabase
            .from('community_questions')
            .insert(questionsData)

          if (questionsError) throw questionsError
        }
      } else if (isEditing) {
        // If editing and no questions, delete any existing ones
        await supabase
          .from('community_questions')
          .delete()
          .eq('community_id', communityId)
      }

      toast.success('Application settings saved successfully!')
    } catch (error) {
      console.error('Error saving application settings:', error)
      toast.error('Failed to save application settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Join Page Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guidelines')}
            className={`${
              activeTab === 'guidelines'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Guidelines
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`${
              activeTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Application Questions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Join Page Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={joinDescription}
                onChange={(e) => setJoinDescription(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="Welcome message or description shown on the join page..."
              />
              <p className="mt-1 text-sm text-gray-500">
                This description will be shown to users before they join the community.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div className="mt-1 space-y-4">
                {joinCoverPreview && (
                  <div className="relative">
                    <img
                      src={joinCoverPreview}
                      alt="Join page cover preview"
                      className="w-full h-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setJoinCoverFile(null)
                        setJoinCoverPreview('')
                        setJoinCoverUrl('')
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <label
                  htmlFor="join-cover-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {joinCoverPreview ? 'Change Cover' : 'Upload Cover'}
                </label>
                <input
                  id="join-cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleJoinCoverChange}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Optional cover image displayed on the join page. Wide image recommended (1200x300px), max 10MB.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Button Text
              </label>
              <input
                type="text"
                value={joinButtonText}
                onChange={(e) => setJoinButtonText(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="Join Community"
              />
              <p className="mt-1 text-sm text-gray-500">
                Customize the text shown on the join button.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Community Guidelines</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guidelines Text
              </label>
              <textarea
                value={guidelinesText}
                onChange={(e) => setGuidelinesText(e.target.value)}
                rows={8}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="1. Be respectful to all members&#10;2. No spam or self-promotion&#10;3. Keep discussions relevant..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Community rules and guidelines that members should follow.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={requiresAgreement}
                  onChange={(e) => setRequiresAgreement(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Require users to agree to guidelines before joining
                </span>
              </label>

              {requiresAgreement && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agreement Prompt
                  </label>
                  <input
                    type="text"
                    value={agreementPrompt}
                    onChange={(e) => setAgreementPrompt(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                    placeholder="Do you agree to follow the group guidelines?"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The question users must agree to.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Application Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-2 text-sm font-medium text-gray-900">No questions added</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Add questions to require users to apply before joining.
                </p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add First Question
                </button>
              </div>
            ) : (
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
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
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
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-black placeholder-gray-600"
                            placeholder="Hint text for answer field..."
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
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-black placeholder-gray-600"
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Required question
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {questions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p>
                      Users will need to answer these questions when applying to join your community.
                      Their responses will be available for review in the Applications section.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveApplicationSettings}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Application Settings'}
        </button>
      </div>
    </div>
  )
}