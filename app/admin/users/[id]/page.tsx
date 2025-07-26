"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { UserDetails } from "@/components/admin/user-details"
import { InspectorDetails } from "@/components/admin/inspector-details"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin, loading } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/login')
    }
  }, [loading, isAdmin, router])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data for the specific user ID to determine role
        const response = await api.getUserAnalytics(params.id as string, '30d')
        if (response.success && response.data) {
          setUserData(response.data.user)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoadingData(false)
      }
    }

    if (isAdmin) {
      fetchUserData()
    }
  }, [isAdmin, params.id])

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {userData?.role === 'inspector' ? (
          <InspectorDetails userId={params.id as string} />
        ) : (
          <UserDetails userId={params.id as string} />
        )}
      </div>
    </AdminLayout>
  )
} 