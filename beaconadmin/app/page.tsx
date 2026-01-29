import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/auth/auth-utils'

export default async function HomePage() {
  const admin = await validateAdminSession()

  if (!admin) {
    redirect('/login')
  }

  // If authenticated, redirect to dashboard
  redirect('/dashboard')
}
