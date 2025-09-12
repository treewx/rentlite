'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'An error occurred. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent-100 mb-4">
                <Mail className="h-6 w-6 text-accent-600" />
              </div>
              <h2 className="text-xl font-semibold text-primary-900 mb-2">Check your email</h2>
              <p className="text-primary-600 mb-6">
                If an account with <strong>{email}</strong> exists, you will receive a password reset link shortly.
              </p>
              <div className="space-y-4">
                <Link href="/auth/signin" className="btn-primary w-full">
                  Back to Sign In
                </Link>
                <button 
                  onClick={() => setSuccess(false)} 
                  className="btn-secondary w-full"
                >
                  Send Another Reset Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">RentLite</h1>
          <p className="text-primary-600 mb-8">Simplified Rent Management</p>
          <h2 className="text-2xl font-semibold text-primary-800">Forgot your password?</h2>
          <p className="mt-2 text-sm text-primary-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-primary-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Sending reset link...' : 'Send reset link'}
          </button>

          <div className="text-center">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}