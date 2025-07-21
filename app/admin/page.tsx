"use client"

import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminLayout } from "@/components/admin-layout"
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and key performance metrics</p>
        </div>

        <AdminOverview />
      </div>
    </AdminLayout>
  )
} 