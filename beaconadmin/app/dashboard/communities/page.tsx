import { Suspense } from 'react'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Plus, Edit, Trash2, Users, Eye } from 'lucide-react'
import CommunityList from '@/components/communities/CommunityList'

export default async function CommunitiesPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all communities in your platform.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/communities/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Community
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="bg-white shadow rounded-lg h-64"></div>
          </div>
        }>
          <CommunityList />
        </Suspense>
      </div>
    </div>
  )
}