"use client"

import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminLayout } from "@/components/admin-layout"

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6">
        <AdminOverview />
      </div>
    </AdminLayout>
  )
} 