"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ReportsDashboard } from '@/components/admin/reports-dashboard'
import { EstimatorLayout } from '@/components/estimator/estimator-layout'
import { useAuth } from '@/lib/auth'

export default function EstimatorReportsPage() {
  const { isEstimator, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Ensure only estimators can access this page
    if (!loading && !isEstimator) {
      router.push('/')
      return
    }
  }, [isEstimator, loading, router, isAuthenticated])

  // Show loading or reports for authenticated estimators
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isEstimator) {
    return null // Will redirect to appropriate page
  }

  return (
    <EstimatorLayout>
      <div className="p-6">
        <ReportsDashboard />
      </div>
    </EstimatorLayout>
  )
} 