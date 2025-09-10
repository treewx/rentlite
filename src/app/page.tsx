'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Building2, Shield, Clock, CheckCircle, Mail, BarChart3 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.emailVerified) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading...</p>
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
              <h1 className="text-4xl font-bold text-primary-900">RentLite</h1>
              <p className="text-primary-600 mt-1">Simplified Rent Management</p>
            </div>
            <div className="space-x-4">
              <Link href="/auth/signin" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="text-center py-20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl font-bold text-primary-900 mb-6">
                Streamlined Rent Tracking That Actually Works
              </h2>
              <p className="text-xl text-primary-700 mb-12 leading-relaxed">
                Automatically verify rent payments through your bank statements and get instant notifications. 
                Simple, reliable, and trustworthy property management for modern landlords.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                  Start Free Trial
                </Link>
                <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                  Learn More
                </Link>
              </div>
            </div>
          </section>

          <section id="features" className="py-20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h3 className="text-3xl font-bold text-primary-900 mb-4">
                  Everything you need to manage rent payments
                </h3>
                <p className="text-xl text-primary-600">
                  Automated tracking, instant notifications, and complete transparency
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="card text-center">
                  <div className="mx-auto w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-primary-900 mb-3">Bank Integration</h4>
                  <p className="text-primary-600">
                    Connect with Akahu to automatically verify rent payments against your actual bank statements
                  </p>
                </div>

                <div className="card text-center">
                  <div className="mx-auto w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-primary-900 mb-3">Smart Notifications</h4>
                  <p className="text-primary-600">
                    Get email alerts the day after rent is due - know immediately if payment was received or missed
                  </p>
                </div>

                <div className="card text-center">
                  <div className="mx-auto w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-primary-900 mb-3">Multi-Property</h4>
                  <p className="text-primary-600">
                    Manage multiple properties and tenants from one simple, clean interface
                  </p>
                </div>

                <div className="card text-center">
                  <div className="mx-auto w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-primary-900 mb-3">Flexible Schedules</h4>
                  <p className="text-primary-600">
                    Support for weekly, fortnightly, and monthly rent cycles with custom due dates
                  </p>
                </div>

                <div className="card text-center">
                  <div className="mx-auto w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-primary-900 mb-3">Secure & Private</h4>
                  <p className="text-primary-600">
                    Bank-grade security with email verification and encrypted data storage
                  </p>
                </div>

                <div className="card text-center">
                  <div className="mx-auto w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-accent-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-primary-900 mb-3">Tenant Alerts</h4>
                  <p className="text-primary-600">
                    Optional automatic reminders to tenants when rent payments are missed
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-white/50 rounded-2xl mt-20">
            <div className="max-w-4xl mx-auto text-center px-8">
              <h3 className="text-3xl font-bold text-primary-900 mb-6">
                Ready to simplify your rent management?
              </h3>
              <p className="text-xl text-primary-600 mb-8">
                Join property managers who trust RentLite for reliable, automated rent tracking
              </p>
              <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                Get Started Today
              </Link>
            </div>
          </section>
        </main>

        <footer className="py-12 mt-20 border-t border-primary-200">
          <div className="text-center text-primary-600">
            <p>&copy; 2024 RentLite. Simple, reliable rent management.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}