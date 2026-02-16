import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'
import { isSuperAdmin } from '@/lib/auth/client-auth-utils'
import { redirect } from 'next/navigation'
import { Users, FileText, Calendar, Flag } from 'lucide-react'

export default async function DashboardPage() {
  // Validate admin session
  const admin = await validateAdminSession()
  if (!admin) {
    redirect('/login')
  }

  const supabase = await createServerSupabaseAdminClient()

  // Determine community filter for community admins
  const communityFilter = !isSuperAdmin(admin) && admin.assigned_communities
    ? admin.assigned_communities
    : null

  // Fetch stats with community filtering
  let communitiesQuery = supabase.from('communities').select('id', { count: 'exact' })
  let membersQuery = supabase.from('community_members').select('id', { count: 'exact' })
  let postsQuery = supabase.from('community_posts').select('id', { count: 'exact' })
  let eventsQuery = supabase.from('calendar_events').select('id', { count: 'exact' })

  // Apply community filtering only for community admins (not super admins)
  if (communityFilter) {
    communitiesQuery = communitiesQuery.in('id', communityFilter)
    membersQuery = membersQuery.in('community_id', communityFilter)
    postsQuery = postsQuery.in('community_id', communityFilter)
    eventsQuery = eventsQuery.in('community_id', communityFilter)
  } else if (isSuperAdmin(admin)) {
    // For super admins, count all members and all events (no filtering needed)
    // The queries are already set up correctly above
  }

  const [communitiesResult, membersResult, postsResult, eventsResult] = await Promise.all([
    communitiesQuery,
    membersQuery,
    postsQuery,
    eventsQuery
  ])

  const stats = [
    {
      name: isSuperAdmin(admin) ? 'Total Communities' : 'My Communities',
      value: communitiesResult.count || 0,
      icon: Users,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Total Members',
      value: membersResult.count || 0,
      icon: Users,
      change: '+5.4%',
      changeType: 'positive',
    },
    {
      name: 'Total Posts',
      value: postsResult.count || 0,
      icon: FileText,
      change: '+2.1%',
      changeType: 'positive',
    },
    {
      name: 'Active Events',
      value: eventsResult.count || 0,
      icon: Calendar,
      change: '-1.2%',
      changeType: 'negative',
    },
  ]

  // Fetch recent communities with filtering
  let recentCommunitiesQuery = supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (communityFilter) {
    recentCommunitiesQuery = recentCommunitiesQuery.in('id', communityFilter)
  }

  const { data: recentCommunities } = await recentCommunitiesQuery

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back{admin.full_name ? `, ${admin.full_name}` : ''}! Here's what's happening in {isSuperAdmin(admin) ? 'all communities' : 'your assigned communities'}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
            <dt>
              <div className="absolute rounded-md bg-blue-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Communities Table */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold text-gray-900">
              {isSuperAdmin(admin) ? 'Recent Communities' : 'My Recent Communities'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {isSuperAdmin(admin)
                ? 'A list of the most recently created communities.'
                : 'A list of your most recently created assigned communities.'
              }
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Members
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentCommunities?.map((community) => (
                      <tr key={community.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {community.name}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {community.description || 'No description'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {community.member_count || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            community.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {community.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(community.created_at!).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}