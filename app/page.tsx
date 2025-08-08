"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function VosSystem() {
  const { isAdmin, isAgent, isEstimator, isInspector, isAuthenticated, loading, isCustomer } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      
      // Redirect users based on their role
      if (isAdmin) {
        router.push('/admin')
        return
      }
      
      if (isAgent) {
        router.push('/agent')
        return
      }
      
      if (isEstimator) {
        router.push('/estimator')
        return
      }

      if (isCustomer) {
        router.push('/customer-dashboard')
        return
      }
      // Redirect inspectors to their specialized dashboard
      if (isInspector) {
        router.push('/inspector/dashboard')
        return
      }
    }
  }, [isInspector, isAdmin, isAgent, isEstimator, loading, router, isAuthenticated])

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

  // This should rarely be seen as users will be redirected based on role
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
