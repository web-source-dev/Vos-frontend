"use client"
import { CustomerDashboard } from '@/components/customer-dashboard'
import { AdminLayout } from '@/components/admin-layout'
import { Suspense } from 'react'

export default function VosSystem() {
  return (
    <AdminLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      }>
        <CustomerDashboard />
      </Suspense>
    </AdminLayout>
  )
}
