"use client"

import { UserManagement } from "@/components/admin/user-management"
import { AdminLayout } from "@/components/admin-layout"

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users and their roles</p>
        </div>

        <UserManagement />
      </div>
    </AdminLayout>
  )
} 