import CommunityForm from '@/components/communities/CommunityForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewCommunityPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/communities"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Communities
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create New Community</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to create a new community.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CommunityForm />
      </div>
    </div>
  )
}