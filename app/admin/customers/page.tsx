"use client"
import { CustomerDashboard } from '@/components/customer-dashboard'
import { AdminLayout } from '@/components/admin/admin-layout'

export default function VosSystem() {


  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">View and manage customers</p>
        </div>

        <CustomerDashboard />
      </div>
    </AdminLayout>
  )
}
