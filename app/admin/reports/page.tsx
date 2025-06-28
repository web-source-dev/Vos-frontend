"use client"

import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminReports() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive system reports and performance analytics</p>
        </div>

        <AdminOverview />
      </div>
    </AdminLayout>
  )
} 