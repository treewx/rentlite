'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password')
    }
  }, [token, router])

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = []
    
    if (pwd.length < 8) {
      errors.push('Must be at least 8 characters long')
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Must contain at least one lowercase letter')
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Must contain at least one uppercase letter')
    }
    if (!/\d/.test(pwd)) {
      errors.push('Must contain at least one number')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setError(`Password requirements: ${passwordErrors.join(', ')}`)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?reset=success')
        }, 3000)
      } else {
        setError(data.error || 'An error occurred. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return null // Will redirect
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-900 mb-2">RentLite</h1>
            <p className="text-primary-600 mb-8">Simplified Rent Management</p>
          </div>
          
          <div className="card">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-primary-900 mb-2">Password Reset Successful</h2>
              <p className="text-primary-600 mb-6">
                Your password has been reset successfully. You will be redirected to the sign in page in a few seconds.
              </p>
              <Link href="/auth/signin" className="btn-primary">
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const passwordErrors = validatePassword(password)
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">RentLite</h1>
          <p className="text-primary-600 mb-8">Simplified Rent Management</p>
          <h2 className="text-2xl font-semibold text-primary-800">Reset your password</h2>
          <p className="mt-2 text-sm text-primary-600">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-700 mb-1">
                New password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-primary-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-primary-400" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-full rounded ${isPasswordValid ? 'bg-green-200' : 'bg-gray-200'}`}>
                      <div className={`h-full rounded transition-all ${
                        isPasswordValid ? 'w-full bg-green-500' : 
                        passwordErrors.length <= 2 ? 'w-2/3 bg-yellow-500' : 
                        'w-1/3 bg-red-500'
                      }`} />
                    </div>
                  </div>
                  <ul className="text-xs space-y-1">
                    {passwordErrors.map((error, index) => (
                      <li key={index} className="text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Confirm your new password"
                />
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || password !== confirmPassword}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting password...' : 'Reset password'}
          </button>

          <div className="text-center">
            <Link 
              href="/auth/signin" 
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}