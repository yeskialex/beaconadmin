import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/auth/auth-utils'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await validateAdminSession()

  if (!admin) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar admin={admin} />
      <div className="lg:pl-64">
        <Header admin={admin} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}