'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Settings, Eye, Mail, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Community {
  id: string
  name: string
  member_count?: number
  is_active?: boolean
}

interface CommunityAssignment {
  community_id: string
  assigned_at: string
  communities: Community
}

interface CommunityAdmin {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
  must_change_password: boolean
  admin_community_assignments: CommunityAssignment[]
}

export default function AdminManagementPage() {
  const [communityAdmins, setCommunityAdmins] = useState<CommunityAdmin[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<CommunityAdmin | null>(null)
  const [createdAdmin, setCreatedAdmin] = useState<any>(null)

  const [createForm, setCreateForm] = useState({
    email: '',
    full_name: '',
    community_ids: [] as string[]
  })

  const [assignForm, setAssignForm] = useState({
    community_ids: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch community admins
      const [adminsResponse, communitiesResponse] = await Promise.all([
        fetch('/api/admin/community-admins'),
        fetch('/api/communities')
      ])

      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json()
        setCommunityAdmins(adminsData.communityAdmins || [])
      }

      if (communitiesResponse.ok) {
        const communitiesData = await communitiesResponse.json()
        setCommunities(communitiesData.communities || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/community-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Community admin created successfully!')
        setCreatedAdmin(result.admin)
        setCreateForm({ email: '', full_name: '', community_ids: [] })
        await fetchData()
      } else {
        toast.error(result.error || 'Failed to create community admin')
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleUpdateAssignments = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdmin) return

    try {
      const response = await fetch(`/api/admin/community-admins/${selectedAdmin.id}/assignments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignForm)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Community assignments updated successfully!')
        setShowAssignModal(false)
        setSelectedAdmin(null)
        await fetchData()
      } else {
        toast.error(result.error || 'Failed to update assignments')
      }
    } catch (error) {
      console.error('Error updating assignments:', error)
      toast.error('An error occurred. Please try again.')
    }
  }

  const openAssignModal = (admin: CommunityAdmin) => {
    setSelectedAdmin(admin)
    setAssignForm({
      community_ids: admin.admin_community_assignments.map(a => a.community_id)
    })
    setShowAssignModal(true)
  }

  const getStatusBadge = (admin: CommunityAdmin) => {
    if (!admin.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </span>
      )
    }

    if (admin.must_change_password) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Password Change Required
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage community administrators and their assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Community Admin
        </button>
      </div>

      {/* Community Admins List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Community Administrators</h3>
          <p className="mt-1 text-sm text-gray-500">
            {communityAdmins.length} community admin{communityAdmins.length !== 1 ? 's' : ''}
          </p>
        </div>

        {communityAdmins.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No community admins</h4>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first community administrator.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Community Admin
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {communityAdmins.map((admin) => (
              <div key={admin.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {admin.full_name || admin.email}
                        </h4>
                        {getStatusBadge(admin)}
                      </div>

                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {admin.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Created {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                        {admin.last_login_at && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Last login {new Date(admin.last_login_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {admin.admin_community_assignments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Assigned Communities:</p>
                          <div className="flex flex-wrap gap-1">
                            {admin.admin_community_assignments.map((assignment) => (
                              <span
                                key={assignment.community_id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                              >
                                {assignment.communities.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openAssignModal(admin)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Community Admin</h3>

              {createdAdmin ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900">Admin Created Successfully!</h4>
                        <p className="mt-1 text-sm text-green-700">
                          The community admin account has been created with the following credentials:
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Login Credentials</h4>
                    <div className="text-sm text-yellow-700">
                      <p><strong>Email:</strong> {createdAdmin.email}</p>
                      <p><strong>Temporary Password:</strong> <code className="bg-yellow-100 px-1 rounded">{createdAdmin.tempPassword}</code></p>
                    </div>
                    <p className="mt-2 text-xs text-yellow-600">
                      The admin must change this password on first login.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowCreateModal(false)
                        setCreatedAdmin(null)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign Communities (Optional)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md">
                      {communities.map((community) => (
                        <label
                          key={community.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={createForm.community_ids.includes(community.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm(prev => ({
                                  ...prev,
                                  community_ids: [...prev.community_ids, community.id]
                                }))
                              } else {
                                setCreateForm(prev => ({
                                  ...prev,
                                  community_ids: prev.community_ids.filter(id => id !== community.id)
                                }))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-sm text-gray-700">{community.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Admin
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Communities for {selectedAdmin.full_name || selectedAdmin.email}
              </h3>

              <form onSubmit={handleUpdateAssignments} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Communities
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                    {communities.map((community) => (
                      <label
                        key={community.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={assignForm.community_ids.includes(community.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignForm(prev => ({
                                ...prev,
                                community_ids: [...prev.community_ids, community.id]
                              }))
                            } else {
                              setAssignForm(prev => ({
                                ...prev,
                                community_ids: prev.community_ids.filter(id => id !== community.id)
                              }))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        <span className="text-sm text-gray-700">{community.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {assignForm.community_ids.length} communit{assignForm.community_ids.length !== 1 ? 'ies' : 'y'}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Update Assignments
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