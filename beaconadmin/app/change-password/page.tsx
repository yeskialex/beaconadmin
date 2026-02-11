'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isForced, setIsForced] = useState(false)

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [validations, setValidations] = useState({
    length: false,
    match: false
  })

  useEffect(() => {
    // Check if this is a forced password change
    const urlParams = new URLSearchParams(window.location.search)
    setIsForced(urlParams.get('forced') === 'true')
  }, [])

  useEffect(() => {
    // Update password validations
    setValidations({
      length: formData.newPassword.length >= 8,
      match: formData.newPassword === formData.confirmPassword && formData.newPassword.length > 0
    })
  }, [formData.newPassword, formData.confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validations.length || !validations.match) {
      toast.error('Please ensure all password requirements are met')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Password updated successfully!')
        // Redirect to dashboard after successful change
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        toast.error(result.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isForced ? 'Change Your Password' : 'Update Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isForced
              ? 'You must change your password before proceeding'
              : 'Update your account password for security'
            }
          </p>
        </div>

        {isForced && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p>This is a security requirement. You must change your temporary password to continue.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                required
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                required
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-600"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements</h4>
            <div className="space-y-1">
              <div className={`flex items-center text-sm ${validations.length ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.length ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <div className="h-4 w-4 mr-2 rounded-full border border-gray-300"></div>
                )}
                At least 8 characters long
              </div>
              <div className={`flex items-center text-sm ${validations.match ? 'text-green-600' : 'text-gray-500'}`}>
                {validations.match ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <div className="h-4 w-4 mr-2 rounded-full border border-gray-300"></div>
                )}
                Passwords match
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !validations.length || !validations.match}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating Password...
              </div>
            ) : (
              'Update Password'
            )}
          </button>

          {!isForced && (
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}