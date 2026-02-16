'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Settings, ChevronUp, ChevronDown } from 'lucide-react'

interface TermsCondition {
  id: string
  type: string
  title: string
  content: string
  version: string
  is_required: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

const TERMS_TYPES = [
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'privacy_policy', label: 'Privacy Policy' },
  { value: 'marketing_info', label: 'Marketing Information' },
  { value: 'push_notifications', label: 'Push Notifications' },
  { value: 'data_usage', label: 'Data Usage Agreement' },
  { value: 'community_guidelines', label: 'Community Guidelines' },
]

export default function TermsConditionsPage() {
  const [termsConditions, setTermsConditions] = useState<TermsCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    content: '',
    version: '1.0',
    is_required: false,
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    fetchTermsConditions()
  }, [])

  const fetchTermsConditions = async () => {
    try {
      const response = await fetch('/api/terms-conditions')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setTermsConditions(data.termsConditions)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch terms and conditions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId
        ? `/api/terms-conditions/${editingId}`
        : '/api/terms-conditions'

      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      await fetchTermsConditions()
      resetForm()
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save terms and conditions')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (terms: TermsCondition) => {
    setFormData({
      type: terms.type,
      title: terms.title,
      content: terms.content,
      version: terms.version,
      is_required: terms.is_required,
      is_active: terms.is_active,
      display_order: terms.display_order
    })
    setEditingId(terms.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these terms and conditions?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/terms-conditions/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      await fetchTermsConditions()
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete terms and conditions')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const response = await fetch(`/api/terms-conditions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !is_active })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      await fetchTermsConditions()
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const updateDisplayOrder = async (id: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/terms-conditions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newOrder })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      await fetchTermsConditions()
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update order')
    }
  }

  const resetForm = () => {
    setFormData({
      type: '',
      title: '',
      content: '',
      version: '1.0',
      is_required: false,
      is_active: true,
      display_order: 0
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getTypeLabel = (type: string) => {
    return TERMS_TYPES.find(t => t.value === type)?.label || type
  }

  if (loading && termsConditions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-gray-600 mt-2">Manage application terms and conditions</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Terms & Conditions
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Terms & Conditions' : 'Add New Terms & Conditions'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Select Type</option>
                  {TERMS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., 1.0, 2.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                required
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter the terms and conditions content..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700">
                  Required Agreement
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">
            Terms & Conditions ({termsConditions.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {termsConditions.map((terms) => (
            <div key={terms.id} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {terms.title}
                  </h4>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {getTypeLabel(terms.type)}
                  </span>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    v{terms.version}
                  </span>
                  {terms.is_required && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Required
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateDisplayOrder(terms.id, terms.display_order - 1)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                     
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-500 min-w-[20px] text-center">
                      {terms.display_order}
                    </span>
                    <button
                      onClick={() => updateDisplayOrder(terms.id, terms.display_order + 1)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                     
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleActive(terms.id, terms.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      terms.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={terms.is_active ? 'Active' : 'Inactive'}
                  >
                    {terms.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => handleEdit(terms)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(terms.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                {terms.content.substring(0, 200)}...
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  Created: {new Date(terms.created_at).toLocaleDateString()}
                </div>
                <div>
                  Updated: {new Date(terms.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}

          {termsConditions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No terms and conditions found.</p>
              <p className="text-sm">Add your first terms and conditions document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}