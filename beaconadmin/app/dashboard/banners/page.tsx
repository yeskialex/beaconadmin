'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

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


export default function BannersPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)

  const fetchBanners = async () => {
    try {
      const params = new URLSearchParams()
      if (includeInactive) {
        params.set('include_inactive', 'true')
      }

      const response = await fetch(`/api/banners?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch banners')
      }

      setBanners(data.banners)
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to fetch banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [includeInactive])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete banner')
      }

      toast.success('Banner deleted successfully')
      fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update banner')
      }

      toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchBanners()
    } catch (error) {
      console.error('Error updating banner:', error)
      toast.error('Failed to update banner')
    }
  }

  const isActive = (banner: Banner) => {
    return banner.is_active
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
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600">Manage carousel banners for the mobile app</p>
        </div>
        <Link
          href="/dashboard/banners/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show inactive banners</span>
        </label>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No banners</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new banner.</p>
          <Link
            href="/dashboard/banners/new"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {banners.map((banner) => {
              const currentlyActive = isActive(banner)

              return (
                <li key={banner.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Banner preview */}
                      <div className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement; if (nextElement) nextElement.style.display = 'flex'
                          }}
                        />
                        <div
                          className="w-full h-full bg-gray-200 items-center justify-center hidden"
                        >
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">{banner.title}</h3>
                          <span className="text-sm text-gray-500">#{banner.display_order}</span>
                          {currentlyActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Eye className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <EyeOff className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        {banner.description && (
                          <p className="text-gray-600 text-sm mt-1">{banner.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>by {banner.admin_users.full_name || banner.admin_users.email}</span>
                          <span>Created: {new Date(banner.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                        className={`p-2 rounded-md transition-colors ${
                          banner.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={banner.is_active ? 'Deactivate banner' : 'Activate banner'}
                      >
                        {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      <Link
                        href={`/dashboard/banners/${banner.id}/edit`}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-50 transition-colors"
                       
                      >
                        <Edit className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => handleDelete(banner.id, banner.title)}
                        className="text-red-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
                       
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}