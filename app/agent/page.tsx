"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminOverview } from '@/components/admin/admin-overview'
import { AgentLayout } from '@/components/agent/agent-layout'
import { useAuth } from '@/lib/auth'

export default function AgentDashboard() {
  const { isAgent, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Ensure only agents can access this page
    if (!loading && !isAgent) {
      router.push('/')
      return
    }
  }, [isAgent, loading, router, isAuthenticated])

  // Show loading or dashboard for authenticated agents
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

  if (!isAuthenticated || !isAgent) {
    return null // Will redirect to appropriate page
  }

  return (
    <AgentLayout>
      <div className="p-6">
        <AdminOverview />
      </div>
    </AgentLayout>
  )
} 