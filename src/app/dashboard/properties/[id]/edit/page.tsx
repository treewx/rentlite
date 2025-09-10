'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, User, Mail, Calendar, Hash, Bell } from 'lucide-react'

interface Property {
  id: string
  address: string
  tenantName: string
  tenantEmail: string
  rentDueDay: number
  rentFrequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'
  keywordMatch: string
  notifyTenantOnMissed: boolean
}

export default function EditProperty({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProperty, setIsLoadingProperty] = useState(true)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    address: '',
    tenantName: '',
    tenantEmail: '',
    rentDueDay: 1,
    rentFrequency: 'MONTHLY' as 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY',
    keywordMatch: '',
    notifyTenantOnMissed: false,
  })

  useEffect(() => {
    fetchProperty()
  }, [])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${params.id}`)
      if (response.ok) {
        const property: Property = await response.json()
        setFormData({
          address: property.address,
          tenantName: property.tenantName,
          tenantEmail: property.tenantEmail,
          rentDueDay: property.rentDueDay,
          rentFrequency: property.rentFrequency,
          keywordMatch: property.keywordMatch,
          notifyTenantOnMissed: property.notifyTenantOnMissed,
        })
      } else {
        setError('Property not found')
      }
    } catch {
      setError('Failed to load property')
    } finally {
      setIsLoadingProperty(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update property')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? parseInt(value) 
              : value
    }))
  }

  const getDayOptions = () => {
    if (formData.rentFrequency === 'MONTHLY') {
      return Array.from({ length: 31 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} of month`
      }))
    } else {
      return [
        { value: 1, label: 'Sunday' },
        { value: 2, label: 'Monday' },
        { value: 3, label: 'Tuesday' },
        { value: 4, label: 'Wednesday' },
        { value: 5, label: 'Thursday' },
        { value: 6, label: 'Friday' },
        { value: 7, label: 'Saturday' },
      ]
    }
  }

  if (isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading property...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-primary-900">Edit Property</h1>
          <p className="text-primary-600 mt-1">Update property and tenant details</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-primary-700 mb-1">
                  Property Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="123 Main Street, Auckland"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-primary-700 mb-1">
                  Tenant Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type="text"
                    id="tenantName"
                    name="tenantName"
                    required
                    value={formData.tenantName}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tenantEmail" className="block text-sm font-medium text-primary-700 mb-1">
                  Tenant Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type="email"
                    id="tenantEmail"
                    name="tenantEmail"
                    required
                    value={formData.tenantEmail}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="tenant@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rentFrequency" className="block text-sm font-medium text-primary-700 mb-1">
                  Rent Frequency
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-primary-400" />
                  </div>
                  <select
                    id="rentFrequency"
                    name="rentFrequency"
                    value={formData.rentFrequency}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="FORTNIGHTLY">Fortnightly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="rentDueDay" className="block text-sm font-medium text-primary-700 mb-1">
                  Rent Due {formData.rentFrequency === 'MONTHLY' ? 'Day' : 'Day of Week'}
                </label>
                <select
                  id="rentDueDay"
                  name="rentDueDay"
                  value={formData.rentDueDay}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {getDayOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="keywordMatch" className="block text-sm font-medium text-primary-700 mb-1">
                  Bank Statement Keyword
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-primary-400" />
                  </div>
                  <input
                    type="text"
                    id="keywordMatch"
                    name="keywordMatch"
                    required
                    value={formData.keywordMatch}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="RENT MAIN ST or SMITH RENT"
                  />
                </div>
                <p className="text-sm text-primary-600 mt-1">
                  Enter a keyword that appears in your bank statement when this tenant pays rent
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifyTenantOnMissed"
                    name="notifyTenantOnMissed"
                    checked={formData.notifyTenantOnMissed}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifyTenantOnMissed" className="ml-3 flex items-center text-sm font-medium text-primary-700">
                    <Bell className="h-4 w-4 mr-2" />
                    Send email to tenant when rent is missed
                  </label>
                </div>
                <p className="text-sm text-primary-600 mt-1 ml-7">
                  When enabled, the tenant will receive an automated reminder email if rent is not received on time
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Link href="/dashboard" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Updating Property...' : 'Update Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}