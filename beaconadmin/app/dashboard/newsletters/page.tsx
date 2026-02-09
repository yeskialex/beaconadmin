'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Eye, Edit, Trash2, Plus, Star, Users, Heart, Clock, Check, X, Upload, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Newsletter {
  id: string
  title: string
  subtitle?: string
  content?: string
  author_name?: string
  author_id?: string
  image_url?: string
  thumbnail_url?: string
  category?: string
  tags?: string[]
  is_published: boolean
  is_featured: boolean
  view_count: number
  like_count: number
  published_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  metadata?: any
  profiles?: {
    full_name?: string
    email?: string
    avatar_url?: string
  }
}

export default function NewslettersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    featured: 0,
    totalViews: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    author_name: '',
    category: '',
    tags: '',
    image_url: '',
    thumbnail_url: '',
    is_published: false,
    is_featured: false
  })

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletters')
      const data = await response.json()

      if (data.newsletters) {
        setNewsletters(data.newsletters)

        // Calculate stats
        const total = data.newsletters.length
        const published = data.newsletters.filter((n: Newsletter) => n.is_published).length
        const featured = data.newsletters.filter((n: Newsletter) => n.is_featured).length
        const totalViews = data.newsletters.reduce((sum: number, n: Newsletter) => sum + (n.view_count || 0), 0)

        setStats({ total, published, featured, totalViews })
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'thumbnail') => {
    const file = e.target.files?.[0]
    if (file) {
      const maxSize = type === 'image' ? 10 * 1024 * 1024 : 5 * 1024 * 1024 // 10MB for image, 5MB for thumbnail
      if (file.size > maxSize) {
        alert(`${type === 'image' ? 'Image' : 'Thumbnail'} must be less than ${type === 'image' ? '10MB' : '5MB'}`)
        return
      }

      if (type === 'image') {
        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setThumbnailFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setThumbnailPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `newsletters/${fileName}`

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadingImages(true)

    try {
      let imageUrl = formData.image_url
      let thumbnailUrl = formData.thumbnail_url

      // Upload images if new files were selected
      if (imageFile) {
        const uploadedImageUrl = await uploadImage(imageFile, 'newsletter-images')
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl
        } else {
          alert('Failed to upload image')
          setUploadingImages(false)
          return
        }
      }

      if (thumbnailFile) {
        const uploadedThumbnailUrl = await uploadImage(thumbnailFile, 'newsletter-thumbnails')
        if (uploadedThumbnailUrl) {
          thumbnailUrl = uploadedThumbnailUrl
        } else {
          alert('Failed to upload thumbnail')
          setUploadingImages(false)
          return
        }
      }

      const url = editingNewsletter
        ? `/api/newsletters/${editingNewsletter.id}`
        : '/api/newsletters'

      const method = editingNewsletter ? 'PATCH' : 'POST'

      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          tags: tagsArray
        })
      })

      if (response.ok) {
        fetchNewsletters()
        setShowAddModal(false)
        setEditingNewsletter(null)
        resetForm()
        alert(`Newsletter ${editingNewsletter ? 'updated' : 'created'} successfully`)
      } else {
        const error = await response.json()
        alert(`Failed to ${editingNewsletter ? 'update' : 'create'} newsletter: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving newsletter:', error)
      alert('Failed to save newsletter. Please try again.')
    } finally {
      setUploadingImages(false)
    }
  }

  const deleteNewsletter = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/newsletters/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNewsletters(prev => prev.filter(n => n.id !== id))
        setStats(prev => {
          const deleted = newsletters.find(n => n.id === id)
          if (!deleted) return prev
          return {
            total: prev.total - 1,
            published: prev.published - (deleted.is_published ? 1 : 0),
            featured: prev.featured - (deleted.is_featured ? 1 : 0),
            totalViews: prev.totalViews - (deleted.view_count || 0)
          }
        })
        alert('Newsletter deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete newsletter: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error)
      alert('Failed to delete newsletter. Please try again.')
    }
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/newsletters/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
      })

      if (response.ok) {
        setNewsletters(prev => prev.map(n =>
          n.id === id
            ? { ...n, is_published: !currentStatus, published_at: !currentStatus ? new Date().toISOString() : n.published_at }
            : n
        ))
        setStats(prev => ({
          ...prev,
          published: currentStatus ? prev.published - 1 : prev.published + 1
        }))
      } else {
        const error = await response.json()
        alert(`Failed to ${currentStatus ? 'unpublish' : 'publish'} newsletter: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
      alert('Failed to update newsletter. Please try again.')
    }
  }

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/newsletters/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_featured: !currentStatus
        })
      })

      if (response.ok) {
        setNewsletters(prev => prev.map(n =>
          n.id === id
            ? { ...n, is_featured: !currentStatus }
            : n
        ))
        setStats(prev => ({
          ...prev,
          featured: currentStatus ? prev.featured - 1 : prev.featured + 1
        }))
      } else {
        const error = await response.json()
        alert(`Failed to ${currentStatus ? 'unfeature' : 'feature'} newsletter: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error toggling featured:', error)
      alert('Failed to update newsletter. Please try again.')
    }
  }

  const openEditModal = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter)
    setFormData({
      title: newsletter.title,
      subtitle: newsletter.subtitle || '',
      content: newsletter.content || '',
      author_name: newsletter.author_name || '',
      category: newsletter.category || '',
      tags: newsletter.tags?.join(', ') || '',
      image_url: newsletter.image_url || '',
      thumbnail_url: newsletter.thumbnail_url || '',
      is_published: newsletter.is_published,
      is_featured: newsletter.is_featured
    })
    setImagePreview(newsletter.image_url || '')
    setThumbnailPreview(newsletter.thumbnail_url || '')
    setImageFile(null)
    setThumbnailFile(null)
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      author_name: '',
      category: '',
      tags: '',
      image_url: '',
      thumbnail_url: '',
      is_published: false,
      is_featured: false
    })
    setImageFile(null)
    setThumbnailFile(null)
    setImagePreview('')
    setThumbnailPreview('')
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create, edit, and manage newsletters for your community.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingNewsletter(null)
            resetForm()
            setShowAddModal(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Newsletter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Newsletters
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
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Published
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.published}
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
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Featured
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.featured}
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
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Views
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.totalViews}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletters Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">All Newsletters</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Newsletter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newsletters?.map((newsletter) => (
                  <tr key={newsletter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {newsletter.title}
                        </div>
                        {newsletter.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {newsletter.subtitle}
                          </div>
                        )}
                        {newsletter.tags && newsletter.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {newsletter.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                {tag}
                              </span>
                            ))}
                            {newsletter.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{newsletter.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {newsletter.author_name || newsletter.profiles?.full_name || 'Unknown'}
                        </div>
                        {newsletter.profiles?.email && (
                          <div className="text-gray-500">
                            {newsletter.profiles.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {newsletter.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {newsletter.view_count || 0}
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {newsletter.like_count || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {newsletter.is_published ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Draft
                          </span>
                        )}
                        {newsletter.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {newsletter.published_at
                        ? new Date(newsletter.published_at).toLocaleDateString()
                        : 'Not published'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                          onClick={() => router.push(`/dashboard/newsletters/${newsletter.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Edit"
                          onClick={() => openEditModal(newsletter)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className={`${newsletter.is_published ? 'text-gray-600' : 'text-green-600'} hover:opacity-75 transition-opacity`}
                          title={newsletter.is_published ? 'Unpublish' : 'Publish'}
                          onClick={() => togglePublish(newsletter.id, newsletter.is_published)}
                        >
                          {newsletter.is_published ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          className={`${newsletter.is_featured ? 'text-yellow-600' : 'text-gray-400'} hover:opacity-75 transition-opacity`}
                          title={newsletter.is_featured ? 'Unfeature' : 'Feature'}
                          onClick={() => toggleFeatured(newsletter.id, newsletter.is_featured)}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                          onClick={() => deleteNewsletter(newsletter.id, newsletter.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!newsletters || newsletters.length === 0) && (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No newsletters</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new newsletter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingNewsletter ? 'Edit Newsletter' : 'Create New Newsletter'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Author Name</label>
                  <input
                    type="text"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="news, updates, community"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Main Image</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block w-full cursor-pointer">
                        <div className="flex items-center justify-center w-full px-3 py-2 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                          <Upload className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {imageFile ? imageFile.name : 'Choose image file (max 10MB)'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'image')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview('')
                            setFormData({ ...formData, image_url: '' })
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block w-full cursor-pointer">
                        <div className="flex items-center justify-center w-full px-3 py-2 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                          <Image className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {thumbnailFile ? thumbnailFile.name : 'Choose thumbnail file (max 5MB)'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'thumbnail')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {thumbnailPreview && (
                      <div className="relative">
                        <img src={thumbnailPreview} alt="Thumbnail" className="h-20 w-20 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnailFile(null)
                            setThumbnailPreview('')
                            setFormData({ ...formData, thumbnail_url: '' })
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Publish immediately</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Feature this newsletter</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingNewsletter(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImages ? 'Uploading...' : editingNewsletter ? 'Update' : 'Create'} Newsletter
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