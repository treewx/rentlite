'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Key, Shield, Save, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTokens, setShowTokens] = useState(false)
  
  const [formData, setFormData] = useState({
    akahuAppToken: '',
    akahuUserToken: '',
  })

  useEffect(() => {
    fetchUserSettings()
  }, [])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          akahuAppToken: data.akahuAppToken || '',
          akahuUserToken: data.akahuUserToken || '',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess('Settings updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update settings')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-primary-900">Account Settings</h1>
          <p className="text-primary-600 mt-1">Manage your account preferences and integrations</p>
        </div>

        <div className="space-y-8">
          <div className="card">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-primary-900">Account Information</h2>
                <p className="text-primary-600 text-sm">Your basic account details</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Name</label>
                <input
                  type="text"
                  value={session?.user?.name || ''}
                  disabled
                  className="input-field bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="input-field bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Key className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-semibold text-primary-900">Akahu Integration</h2>
                    <p className="text-primary-600 text-sm">Connect your bank account for automated rent tracking</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTokens(!showTokens)}
                  className="p-2 text-primary-400 hover:text-primary-600"
                >
                  {showTokens ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="akahuAppToken" className="block text-sm font-medium text-primary-700 mb-1">
                    Akahu App Token
                  </label>
                  <input
                    type={showTokens ? 'text' : 'password'}
                    id="akahuAppToken"
                    name="akahuAppToken"
                    value={formData.akahuAppToken}
                    onChange={handleInputChange}
                    className="input-field font-mono text-sm"
                    placeholder="app_token_..."
                  />
                  <p className="text-sm text-primary-600 mt-1">
                    Your Akahu application token for API access
                  </p>
                </div>

                <div>
                  <label htmlFor="akahuUserToken" className="block text-sm font-medium text-primary-700 mb-1">
                    Akahu User Token
                  </label>
                  <input
                    type={showTokens ? 'text' : 'password'}
                    id="akahuUserToken"
                    name="akahuUserToken"
                    value={formData.akahuUserToken}
                    onChange={handleInputChange}
                    className="input-field font-mono text-sm"
                    placeholder="user_token_..."
                  />
                  <p className="text-sm text-primary-600 mt-1">
                    Your Akahu user token for accessing your account data
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">How to get your Akahu tokens:</h3>
                <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                  <li>Visit the <a href="https://developers.akahu.nz" target="_blank" rel="noopener noreferrer" className="underline">Akahu Developer Portal</a></li>
                  <li>Create an application and get your App Token</li>
                  <li>Follow the OAuth flow to get your User Token</li>
                  <li>Enter both tokens above to enable bank statement checking</li>
                </ol>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <Link href="/dashboard" className="btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-medium text-primary-900">Security & Privacy</h3>
            </div>
            <div className="text-sm text-primary-600 space-y-2">
              <p>• Your Akahu tokens are encrypted and stored securely</p>
              <p>• We only access your bank statements to check for rent payments</p>
              <p>• Your financial data never leaves your control</p>
              <p>• You can revoke access at any time by removing your tokens</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}