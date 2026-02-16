'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema)
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Password changed successfully!')
        reset() // Clear the form
        // Optionally redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        toast.error(result.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('An error occurred while changing password')
    } finally {
      setIsLoading(false)
    }
  }

  const PasswordInput = ({
    id,
    label,
    show,
    toggleShow,
    register,
    error,
    placeholder
  }: {
    id: keyof ChangePasswordFormData
    label: string
    show: boolean
    toggleShow: () => void
    register: any
    error?: string
    placeholder: string
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          {...register(id)}
          type={show ? 'text' : 'password'}
          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 flex items-center"
          onClick={toggleShow}
        >
          {show ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Lock className="h-6 w-6 mr-2" />
          Change Password
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your account password to keep your account secure.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <PasswordInput
            id="currentPassword"
            label="Current Password"
            show={showCurrentPassword}
            toggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            register={register}
            error={errors.currentPassword?.message}
            placeholder="Enter your current password"
          />

          <PasswordInput
            id="newPassword"
            label="New Password"
            show={showNewPassword}
            toggleShow={() => setShowNewPassword(!showNewPassword)}
            register={register}
            error={errors.newPassword?.message}
            placeholder="Enter your new password (min 8 characters)"
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            register={register}
            error={errors.confirmPassword?.message}
            placeholder="Confirm your new password"
          />

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Should contain a mix of letters, numbers, and special characters</li>
              <li>• Avoid using common words or personal information</li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}