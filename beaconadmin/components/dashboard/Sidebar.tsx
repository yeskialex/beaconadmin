'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Flag,
  LogOut,
  Shield,
  Mail,
  Settings,
  Image,
  Bell,
  ScrollText,
  ClipboardList,
  ChevronDown,
  Key,
  User,
} from 'lucide-react'
import { AdminUser, isSuperAdmin } from '@/lib/auth/client-auth-utils'

interface SidebarProps {
  admin: AdminUser
}

// Base navigation items available to all admins
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Communities', href: '/dashboard/communities', icon: Users },
  { name: 'Applications', href: '/dashboard/applications', icon: ClipboardList },
  { name: 'Members', href: '/dashboard/members', icon: Shield },
  { name: 'Posts', href: '/dashboard/posts', icon: FileText },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Notices', href: '/dashboard/notices', icon: Bell },
  { name: 'Reports', href: '/dashboard/reports', icon: Flag },
]

// Additional navigation items only for super admins
const superAdminNavigation = [
  { name: 'Banners', href: '/dashboard/banners', icon: Image },
  { name: 'Newsletters', href: '/dashboard/newsletters', icon: Mail },
  { name: 'Terms & Conditions', href: '/dashboard/terms-conditions', icon: ScrollText },
  { name: 'Admin Management', href: '/dashboard/admin-management', icon: Settings },
]

export default function Sidebar({ admin }: SidebarProps) {
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Build navigation based on admin role
  const navigation = isSuperAdmin(admin)
    ? [...baseNavigation, ...superAdminNavigation]
    : baseNavigation

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
        <div className="flex flex-shrink-0 border-t border-gray-800">
          <div className="relative w-full">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center w-full p-4 text-left hover:bg-gray-800 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{admin.full_name || admin.email}</p>
                <p className="text-xs text-gray-400">{admin.role}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg">
                <Link
                  href="/dashboard/settings/change-password"
                  className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Key className="h-4 w-4 mr-3" />
                  Change Password
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}