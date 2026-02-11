import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, Mail, Calendar, Check, X } from 'lucide-react'
import Link from 'next/link'

export default async function MembersPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch user profiles with community memberships
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      *,
      universities(name),
      countries(name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch pending join applications
  const { data: pendingRequests } = await supabase
    .from('community_join_applications')
    .select(`
      *,
      communities(name),
      profiles!community_join_applications_user_id_fkey(full_name, email)
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage users, verify profiles, and handle community join applications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {profiles?.length || 0}
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
                    Verified Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {profiles?.filter(p => p.verification_status === 'verified').length || 0}
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
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Applications
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pendingRequests?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Join Applications */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Join Applications</h3>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.profiles?.full_name || request.profiles?.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        wants to join <span className="font-medium">{request.communities?.name}</span>
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          Message: "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">All Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles?.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {profile.avatar_url ? (
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={profile.avatar_url} 
                            alt={profile.full_name || ''}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profile.full_name || profile.display_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {profile.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.universities?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.countries?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        profile.verification_status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : profile.verification_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : profile.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.verification_status || 'unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(profile.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/users/${profile.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )) ?? []}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}