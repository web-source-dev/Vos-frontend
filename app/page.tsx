"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerDashboard } from '@/components/customer-dashboard'
import { useAuth } from '@/lib/auth'

export default function VosSystem() {
  const { isAdmin, isInspector,isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if(!isAuthenticated){
      router.push('/login')
    }
    // Redirect inspectors to their specialized dashboard
    if (!loading && isInspector) {
      router.push('/inspector/dashboard')
    }
    if (!loading && isAdmin) {
      router.push('/admin')
    }

  }, [isInspector, isAdmin, loading, router, isAuthenticated])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerDashboard />
    </div>
  )
}
