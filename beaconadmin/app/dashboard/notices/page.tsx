'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Users,
  Bell,
  Eye,
  Clock,
  Filter,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'

interface Notice {
  id: string
  title: string
  content: string
  community_id: string
  created_at: string
  updated_at: string
  creator_display_name?: string
  images?: string[]
  communities: {
    name: string
  }
}

interface Community {
  id: string
  name: string
}

export default function NoticesPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    community_id: '',
    images: [] as string[]
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetchNotices(),
      fetchCommunities()
    ])
  }, [])

  const fetchNotices = async () => {
    try {
      const url = selectedCommunity
        ? `/api/notices?community_id=${selectedCommunity}`
        : '/api/notices'

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setNotices(data.notices)
      } else {
        toast.error(data.error || 'Failed to fetch notices')
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
      toast.error('Failed to fetch notices')
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities')
      const data = await response.json()

      if (response.ok) {
        setCommunities(data.communities)
      } else {
        console.error('Failed to fetch communities:', data.error)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
    }
  }

  useEffect(() => {
    if (selectedCommunity !== undefined) {
      fetchNotices()
    }
  }, [selectedCommunity])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 images
    if (selectedFiles.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images')
      return
    }

    setSelectedFiles(prev => [...prev, ...files])

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => {
      // Revoke the URL to free up memory
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return []

    setUploadingImages(true)
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch('/api/notices/upload-images', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload images')
      }

      const { urls } = await response.json()
      return urls
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
      return []
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim() || !formData.community_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      // Upload images first if there are any
      let imageUrls: string[] = formData.images || []
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages()
        if (imageUrls.length === 0 && selectedFiles.length > 0) {
          // Images failed to upload
          return
        }
      }

      const url = editingNotice
        ? `/api/notices/${editingNotice.id}`
        : '/api/notices'

      const method = editingNotice ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: imageUrls
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Notice ${editingNotice ? 'updated' : 'created'} successfully`)
        setShowCreateModal(false)
        setEditingNotice(null)
        resetForm()
        fetchNotices()
      } else {
        toast.error(result.error || `Failed to ${editingNotice ? 'update' : 'create'} notice`)
      }
    } catch (error) {
      console.error('Error saving notice:', error)
      toast.error('Failed to save notice')
    }
  }

  const handleDelete = async (notice: Notice) => {
    if (!confirm(`Are you sure you want to delete "${notice.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/notices/${notice.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Notice deleted successfully')
        fetchNotices()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete notice')
      }
    } catch (error) {
      console.error('Error deleting notice:', error)
      toast.error('Failed to delete notice')
    }
  }

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      community_id: notice.community_id,
      images: notice.images || []
    })
    setSelectedFiles([])
    setImagePreviewUrls(notice.images || [])
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      community_id: '',
      images: []
    })
    setSelectedFiles([])
    setImagePreviewUrls([])
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Notices</h1>
          <p className="text-gray-600">Manage announcements and notices for your communities</p>
        </div>
        <button
          onClick={() => {
            setEditingNotice(null)
            resetForm()
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Notice
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="block w-64 rounded-md border border-gray-300 px-3 py-2 text-black"
          >
            <option value="">All Communities</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notices List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {notices.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No notices</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new community notice.
            </p>
            <button
              onClick={() => {
                setEditingNotice(null)
                resetForm()
                setShowCreateModal(true)
              }}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Notice
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notices.map((notice) => (
              <li key={notice.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {notice.title}
                      </h3>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {notice.content}
                    </p>

                    {/* Display images if available */}
                    {notice.images && notice.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {notice.images.length} image{notice.images.length !== 1 ? 's' : ''} attached
                        </span>
                        <div className="flex -space-x-2">
                          {notice.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Notice image ${idx + 1}`}
                              className="h-8 w-8 rounded-md border-2 border-white object-cover"
                            />
                          ))}
                          {notice.images.length > 3 && (
                            <div className="h-8 w-8 rounded-md border-2 border-white bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{notice.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {notice.communities.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {new Date(notice.created_at).toLocaleDateString()}
                      </div>
                      <span>by {notice.creator_display_name || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(notice)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
                      title="Edit notice"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(notice)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingNotice ? 'Edit Notice' : 'Create New Notice'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    placeholder="Enter notice title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community *
                  </label>
                  <select
                    required
                    value={formData.community_id}
                    onChange={(e) => setFormData({ ...formData, community_id: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  >
                    <option value="">Select a community...</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    placeholder="Enter notice content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images (Max 5)
                  </label>

                  {/* Image upload area */}
                  <div className="mt-2">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={selectedFiles.length >= 5}
                      />
                    </label>
                  </div>

                  {/* Image previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingNotice(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingNotice ? 'Update' : 'Create'} Notice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}