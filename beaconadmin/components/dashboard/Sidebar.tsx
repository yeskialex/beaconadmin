'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  Flag,
  LogOut,
  Shield,
} from 'lucide-react'
import { AdminUser } from '@/lib/auth/auth-utils'

interface SidebarProps {
  admin: AdminUser
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Communities', href: '/dashboard/communities', icon: Users },
  { name: 'Members', href: '/dashboard/members', icon: Shield },
  { name: 'Posts', href: '/dashboard/posts', icon: FileText },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Reports', href: '/dashboard/reports', icon: Flag },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar({ admin }: SidebarProps) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
        <div className="flex h-16 flex-shrink-0 items-center px-4 bg-gray-900">
          <h1 className="text-xl font-bold text-white">Beacon Admin</h1>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    } mr-3 h-5 w-5 flex-shrink-0 transition-colors`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-shrink-0 border-t border-gray-800 p-4">
          <div className="flex items-center w-full">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{admin.full_name || admin.email}</p>
              <p className="text-xs text-gray-400">{admin.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-3 text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}