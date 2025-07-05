"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerDashboard } from '@/components/customer-dashboard'
import { useAuth } from '@/lib/auth'

export default function VosSystem() {
  const { isAdmin, isInspector, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/customer-intake')
        return
      }
      
      // Redirect inspectors to their specialized dashboard
      if (isInspector) {
        router.push('/inspector/dashboard')
        return
      }
      
      if (isAdmin) {
        router.push('/admin')
        return
      }
    }
  }, [isInspector, isAdmin, loading, router, isAuthenticated])

  // Show loading or dashboard for authenticated users
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to public page
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerDashboard />
    </div>
  )
}
