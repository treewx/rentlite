'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plus, Building2, Settings, LogOut, Edit, Trash2 } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && !session?.user?.emailVerified) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProperties()
    }
  }, [session])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setProperties(properties.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Error deleting property:', error)
    }
  }

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'WEEKLY': return 'Weekly'
      case 'FORTNIGHTLY': return 'Fortnightly'
      case 'MONTHLY': return 'Monthly'
      default: return frequency
    }
  }

  const getDayDisplay = (day: number, frequency: string) => {
    if (frequency === 'MONTHLY') {
      return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month`
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[day - 1] || day.toString()
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">RentLite Dashboard</h1>
              <p className="text-primary-600 mt-1">Welcome back, {session?.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/settings" className="p-2 text-primary-600 hover:text-primary-700">
                <Settings className="h-5 w-5" />
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-primary-600 hover:text-primary-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-primary-900">Your Properties</h2>
            <Link href="/dashboard/properties/new" className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="card text-center py-12">
              <Building2 className="h-16 w-16 text-primary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-900 mb-2">No properties yet</h3>
              <p className="text-primary-600 mb-6">
                Add your first property to start tracking rent payments automatically
              </p>
              <Link href="/dashboard/properties/new" className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div key={property.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-900 mb-1">
                        {property.address}
                      </h3>
                      <p className="text-primary-600">Tenant: {property.tenantName}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        href={`/dashboard/properties/${property.id}/edit`}
                        className="p-2 text-primary-400 hover:text-primary-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => deleteProperty(property.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-primary-600">Frequency:</span>
                      <span className="text-primary-900">{getFrequencyDisplay(property.rentFrequency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-600">Due:</span>
                      <span className="text-primary-900">{getDayDisplay(property.rentDueDay, property.rentFrequency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-600">Bank keyword:</span>
                      <span className="text-primary-900 font-mono text-xs">{property.keywordMatch}</span>
                    </div>
                    {property.notifyTenantOnMissed && (
                      <div className="mt-2 px-2 py-1 bg-accent-50 rounded text-accent-700 text-xs">
                        Tenant notifications enabled
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/dashboard/properties/new" className="block btn-secondary w-full text-left">
                  <Plus className="h-4 w-4 mr-2 inline" />
                  Add New Property
                </Link>
                <Link href="/dashboard/settings" className="block btn-secondary w-full text-left">
                  <Settings className="h-4 w-4 mr-2 inline" />
                  Account Settings
                </Link>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Recent Activity</h3>
              <p className="text-primary-600 text-sm">
                Activity tracking will appear here once you have properties set up and rent checks running.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}