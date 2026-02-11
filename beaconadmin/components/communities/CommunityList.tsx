'use client'

import { useState, useEffect } from 'react'
import { Edit, Trash2, Users, Eye, Plus, FileText } from 'lucide-react'
import Link from 'next/link'

export default function CommunityList() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities')
      const data = await response.json()

      if (data.communities) {
        setCommunities(data.communities)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (error) {
      console.error('Error fetching communities:', error)
      setError('Failed to load communities')
    } finally {
      setLoading(false)
    }
  }

  const deleteCommunity = async (communityId: string, communityName: string) => {
    if (!confirm(
      `⚠️ WARNING: This will permanently delete "${communityName}" and ALL related data:\n\n` +
      `• All posts in this community\n` +
      `• All comments on those posts\n` +
      `• All events in this community\n` +
      `• All members and join applications\n\n` +
      `This action CANNOT be undone.\n\n` +
      `Type "DELETE" to confirm you want to proceed:`
    )) {
      return
    }

    const confirmation = prompt(
      `To confirm deletion of "${communityName}", please type "DELETE" (in all caps):`
    )

    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled. Community was not deleted.')
      return
    }

    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        // Remove community from local state
        setCommunities(prev => prev.filter(community => community.id !== communityId))
        alert(result.message || 'Community and all related data deleted successfully')
      } else {
        alert(`Failed to delete community: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting community:', error)
      alert('Failed to delete community. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white shadow rounded-lg h-64"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading communities: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Community
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                University
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Privacy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scope
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {communities?.map((community) => (
              <tr key={community.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {community.avatar_url ? (
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={community.avatar_url} 
                        alt={community.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {community.name}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {community.description || 'No description'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {community.universities?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {community.member_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {community.is_private ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Private
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">
                      Public
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    community.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {community.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    community.scope === 'global'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {community.scope}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(community.created_at!).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/dashboard/communities/${community.id}`}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/communities/${community.id}/applications`}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="Applications"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/communities/${community.id}/edit`}
                      className="text-yellow-600 hover:text-yellow-900 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete Community (Cascading)"
                      onClick={() => deleteCommunity(community.id, community.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) ?? []}
          </tbody>
        </table>
        {(!communities || communities.length === 0) && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No communities</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new community.
            </p>
            <div className="mt-6">
              <Link
                href="/communities/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Community
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}